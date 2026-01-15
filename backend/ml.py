import pandas as pd
import numpy as np
from io import StringIO
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import accuracy_score, r2_score
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer

class DataAnalyzer:
    @staticmethod
    def analyze(df: pd.DataFrame) -> dict:
        summary = {
            "rows": len(df),
            "cols": len(df.columns),
            "columns": list(df.columns),
            "types": df.dtypes.astype(str).to_dict(),
            "missing": df.isnull().sum().to_dict(),
            "preview": df.head(5).to_dict(orient="records")
        }
        
        numeric_df = df.select_dtypes(include=[np.number])
        if not numeric_df.empty:
            stats = numeric_df.describe().T
            summary["numeric_stats"] = stats[["mean", "min", "max", "50%"]].to_dict(orient="index")

            try:
                corr_matrix = numeric_df.corr().abs()
                upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
                high_corr = [column for column in upper.columns if any(upper[column] > 0.8)]
                summary["high_correlation_warnings"] = high_corr
            except Exception:
                summary["high_correlation_warnings"] = []
        
        quality_report = DataAnalyzer._check_data_utility(df)
        summary["quality_report"] = quality_report
        summary["model_recommendations"] = DataAnalyzer._recommend_models(df, quality_report)
        
        # AutoML Execution
        best_model_info = DataAnalyzer._run_automl_simulation(df, quality_report)
        summary["automl_result"] = best_model_info
            
        return summary

    @staticmethod
    def _check_data_utility(df: pd.DataFrame) -> dict:

        utility = {
            "useless_columns": [], 
            "potential_targets": [], 
            "high_cardinality": [] 
        }
        
        threshold_missing = 0.4 
        
        for col in df.columns:

            missing_ratio = df[col].isnull().mean()
            if missing_ratio > threshold_missing:
                utility["useless_columns"].append(f"{col} (Muchos nulos: {missing_ratio:.0%})")
                continue

            if df[col].nunique() <= 1:
                utility["useless_columns"].append(f"{col} (Constante)")
                continue

            if df[col].dtype == 'object':
                unique_ratio = df[col].nunique() / len(df)
                if unique_ratio > 0.9 and len(df) > 50:
                    utility["high_cardinality"].append(f"{col}")

            if df[col].nunique() < 20: 
                utility["potential_targets"].append(f"{col} (Clasificación)")
            elif pd.api.types.is_numeric_dtype(df[col]):
                utility["potential_targets"].append(f"{col} (Regresión)")
                
        return utility

    @staticmethod
    def _recommend_models(df: pd.DataFrame, quality: dict) -> list:

        recommendations = []
        rows, cols = df.shape

        if rows < 50:
            recommendations.append("Dataset muy pequeño. Sugerido: Métodos estadísticos.")
        elif rows < 1000:
            recommendations.append("Dataset mediano. Sugerido: Regresión Logística, SVM, Decision Trees.")
        else:
            recommendations.append("Dataset grande. Sugerido: Random Forest, XGBoost.")
            
        if cols > rows:
            recommendations.append("Alta dimensionalidad. CRITICO usar PCA o Lasso.")
            
        num_cols = len(df.select_dtypes(include=[np.number]).columns)
        cat_cols = len(df.select_dtypes(include=['object', 'category']).columns)
        
        if cat_cols > 0 and num_cols > 0:
            recommendations.append("Datos mixtos. Random Forest maneja bien esto.")
        
        return recommendations

    @staticmethod
    def _run_automl_simulation(df: pd.DataFrame, quality: dict) -> dict:
        """
        Intenta detectar target, preprocesar y entrenar modelos simples.
        Retorna el mejor modelo encontrado.
        """
        try:
            # 1. Heurística simple para target: última columna viable
            potential_targets = [t.split(" ")[0] for t in quality["potential_targets"]]
            if not potential_targets:
                return {"status": "skipped", "reason": "No se detectaron targets claros."}
            
            # Preferimos la última columna como target por convención
            target_col = potential_targets[-1]
            if target_col in quality["high_cardinality"] or target_col in [u.split(" ")[0] for u in quality["useless_columns"]]:
                return {"status": "skipped", "reason": "Target probable es de baja calidad."}
            
            # 2. Preprocesamiento simple
            df_clean = df.copy()
            # Eliminar columnas inútiles
            drop_cols = [u.split(" ")[0] for u in quality["useless_columns"]]
            df_clean.drop(columns=drop_cols, errors='ignore', inplace=True)
            
            # Imputar y codificar
            X = df_clean.drop(columns=[target_col])
            y = df_clean[target_col]
            
            # Rellenar nulos numéricos
            num_cols = X.select_dtypes(include=[np.number]).columns
            if not num_cols.empty:
                X[num_cols] = SimpleImputer(strategy='mean').fit_transform(X[num_cols])
                
            # Codificar categóricos (simple LabelEncoder para todo por rapidez)
            cat_cols = X.select_dtypes(include=['object']).columns
            for col in cat_cols:
                X[col] = LabelEncoder().fit_transform(X[col].astype(str))
                
            # Split
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # 3. Selección de Tipo de Problema y Entrenamiento
            results = {}
            is_classification = df[target_col].nunique() < 20 or df[target_col].dtype == 'object'
            
            if is_classification:
                # Codificar target si es necesario
                if y.dtype == 'object':
                    le = LabelEncoder()
                    y_train = le.fit_transform(y_train)
                    y_test = le.transform(y_test)
                
                models = {
                    "Logistic Regression": LogisticRegression(max_iter=1000),
                    "Random Forest Classifier": RandomForestClassifier(n_estimators=50, max_depth=10)
                }
                metric_name = "Accuracy"
                for name, model in models.items():
                    model.fit(X_train, y_train)
                    preds = model.predict(X_test)
                    results[name] = accuracy_score(y_test, preds)
                    
            else: # Regresión
                # Limpiar nulos target si hay
                if pd.isnull(y).any():
                    valid_idx = ~pd.isnull(y)
                    X, y = X[valid_idx], y[valid_idx]
                    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

                models = {
                    "Linear Regression": LinearRegression(),
                    "Random Forest Regressor": RandomForestRegressor(n_estimators=50, max_depth=10)
                }
                metric_name = "R2 Score"
                for name, model in models.items():
                    model.fit(X_train, y_train)
                    preds = model.predict(X_test)
                    results[name] = r2_score(y_test, preds)

            # 4. Elegir ganador
            best_model_name = max(results, key=results.get)
            best_score = results[best_model_name]
            
            return {
                "status": "success",
                "target_used": target_col,
                "problem_type": "Clasificación" if is_classification else "Regresión",
                "best_model": best_model_name,
                "metric_name": metric_name,
                "score": best_score,
                "all_results": results
            }
            
        except Exception as e:
            return {"status": "error", "reason": str(e)}

    @staticmethod
    def generate_llm_summary(df: pd.DataFrame) -> str:
        """
        Crea un string descriptivo del dataset optimizado para el prompt del sistema.
        Incluye recomendaciones de ML y análisis de utilidad.
        """
        analysis = DataAnalyzer.analyze(df)
        
        text = f"Dataset: {analysis['rows']} filas x {analysis['cols']} columnas.\n\n"
        
        text += "--- ANÁLISIS DE CALIDAD ---\n"
        quality = analysis['quality_report']
        if quality['useless_columns']:
            text += f"⚠️ Columnas con poca utilidad: {', '.join(quality['useless_columns'])}\n"
        if "high_correlation_warnings" in analysis and analysis["high_correlation_warnings"]:
            text += f"⚠️ Alta correlación detectada en: {', '.join(analysis['high_correlation_warnings'])}\n"
        
        text += "\n--- AUTOML PRELIMINAR ---\n"
        automl = analysis.get("automl_result", {})
        if automl.get("status") == "success":
            text += f"✅ Se ha realizado una prueba automática prediciendo: '{automl['target_used']}' ({automl['problem_type']}).\n"
            text += f"🏆 MEJOR MODELO APLICADO: {automl['best_model']} ({automl['metric_name']}: {automl['score']:.4f})\n"
            text += "Comparativa rápida:\n"
            for model, score in automl['all_results'].items():
                text += f"- {model}: {score:.4f}\n"
        elif automl.get("status") == "error":
            text += f"❌ Error en AutoML: {automl['reason']}\n"
        else:
            text += "ℹ️ AutoML omitido (no se detectó target claro o datos insuficientes).\n"

        text += "\n--- OBJETIVOS POTENCIALES ---\n"
        targets = quality['potential_targets'][:5]
        if targets:
            text += f"Columnas candidatas: {', '.join(targets)}\n"
        
        return text