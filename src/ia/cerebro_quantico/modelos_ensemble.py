"""
🎼 SINFONIA DE MODELOS DE IA TRANSCENDENTAL
Combina 6 algoritmos supremos em harmonia perfeita
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
import warnings
warnings.filterwarnings('ignore')

class ModelosEnsembleSupremo:
    """Orquestra múltiplos modelos de IA como sinfonia perfeita"""
    
    def __init__(self):
        self.modelos = {
            'floresta_aleatoria': self._criar_floresta_aleatoria(),
            'regressao_linear': self._criar_regressao_linear(),
            'svm_otimizado': self._criar_svm_otimizado(),
            'gradient_boosting': self._criar_gradient_boosting(),
            'redes_neurais': self._criar_redes_neurais(),
            'modelo_temporal': self._criar_modelo_temporal()
        }
        self.pesos_modelos = {}
        self.performance_historica = {}
        
    def _criar_floresta_aleatoria(self):
        """Cria Random Forest otimizada para trading"""
        return RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
    
    def _criar_regressao_linear(self):
        """Cria modelo de regressão linear regularizada"""
        from sklearn.linear_model import Ridge
        return Ridge(alpha=1.0, random_state=42)
    
    def _criar_svm_otimizado(self):
        """Cria SVM otimizado para séries temporais"""
        from sklearn.svm import SVR
        return SVR(kernel='rbf', C=100, gamma='scale')
    
    def _criar_gradient_boosting(self):
        """Cria XGBoost otimizado"""
        try:
            import xgboost as xgb
            return xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                n_jobs=-1
            )
        except ImportError:
            from sklearn.ensemble import GradientBoostingRegressor
            return GradientBoostingRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            )
    
    def _criar_redes_neurais(self):
        """Cria rede neural simples mas eficaz"""
        from sklearn.neural_network import MLPRegressor
        return MLPRegressor(
            hidden_layer_sizes=(100, 50),
            activation='relu',
            solver='adam',
            learning_rate='adaptive',
            max_iter=500,
            random_state=42
        )
    
    def _criar_modelo_temporal(self):
        """Cria modelo específico para séries temporais"""
        from sklearn.linear_model import ElasticNet
        return ElasticNet(alpha=0.1, l1_ratio=0.5, random_state=42)
    
    def treinar_ensemble(self, dados_historicos, target):
        """Treina todos os modelos do ensemble"""
        print("🎼 Iniciando treinamento da SINFONIA DE IA...")
        
        # Divisão temporal para validação
        tscv = TimeSeriesSplit(n_splits=5)
        
        for nome, modelo in self.modelos.items():
            print(f"   🎵 Treinando {nome}...")
            
            scores = []
            for train_idx, val_idx in tscv.split(dados_historicos):
                X_train, X_val = dados_historicos.iloc[train_idx], dados_historicos.iloc[val_idx]
                y_train, y_val = target.iloc[train_idx], target.iloc[val_idx]
                
                modelo.fit(X_train, y_train)
                score = modelo.score(X_val, y_val)
                scores.append(score)
            
            self.performance_historica[nome] = np.mean(scores)
            print(f"      ✅ {nome}: Score = {self.performance_historica[nome]:.4f}")
        
        # Calcula pesos baseados na performance
        self._calcular_pesos_otimos()
        print("🎼 SINFONIA DE IA TREINADA COM SUCESSO!")
    
    def _calcular_pesos_otimos(self):
        """Calcula pesos ótimos baseados na performance"""
        total_performance = sum(self.performance_historica.values())
        
        for nome, performance in self.performance_historica.items():
            self.pesos_modelos[nome] = performance / total_performance
    
    def prever(self, dados_atuais):
        """Faz previsão usando ensemble ponderado"""
        predicoes = {}
        
        for nome, modelo in self.modelos.items():
            try:
                predicao = modelo.predict(dados_atuais.values.reshape(1, -1))[0]
                predicoes[nome] = predicao
            except Exception as e:
                print(f"⚠️ Erro em {nome}: {e}")
                predicoes[nome] = 0
        
        # Previsão final ponderada
        predicao_final = sum(
            predicoes[nome] * self.pesos_modelos.get(nome, 0) 
            for nome in predicoes
        )
        
        return {
            'predicao_final': predicao_final,
            'predicoes_individuais': predicoes,
            'confianca': self._calcular_confianca(predicoes)
        }
    
    def _calcular_confianca(self, predicoes):
        """Calcula nível de confiança da previsão"""
        valores = list(predicoes.values())
        if len(valores) < 2:
            return 0.5
        
        # Baixa variação = alta confiança
        variacao = np.std(valores) / np.mean(valores) if np.mean(valores) != 0 else 1
        confianca = max(0.0, min(1.0, 1.0 - float(variacao)))
        
        return confianca
