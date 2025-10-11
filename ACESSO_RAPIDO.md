# 🚀 ACESSO RÁPIDO - Dashboard de Insights

## 📍 Como Acessar

### 1. **Abrir o Dashboard:**
```
http://localhost:3000/dashboard.html
```

### 2. **Limpar Cache (IMPORTANTE):**
Pressione: **Ctrl + Shift + R** (ou Ctrl + F5)

### 3. **Clicar no Menu:**
No sidebar esquerdo, clique em: **💡 Insights**

---

## 🧪 Testar se Está Funcionando

Execute no PowerShell:
```powershell
.\test-insights.ps1
```

**Resultado Esperado:**
```
✅ Servidor rodando (HTTP 200)
✅ Menu Insights encontrado no HTML
✅ Listar Anotações - OK
✅ Padrões Identificados - OK
✅ Estatísticas de Sentimentos - OK

✅ TODOS OS TESTES PASSARAM!
```

---

## 🎯 O Que Você Verá no Dashboard

### **Cards de Estatísticas (topo):**
- 📝 Anotações Capturadas: 2
- 🔍 Padrões Identificados: 0
- 💡 Melhorias Sugeridas: 0
- 😊 Sentimento Médio: 3.86/5

### **Gráficos:**
- 📊 Distribuição por Tipo
- 😊 Distribuição por Sentimento

### **Padrões Identificados:**
- 📋 Por Tipo
- 🏷️ Tags Mais Frequentes
- ⚠️ Trilhas Problemáticas

### **Anotações Recentes:**
Lista das últimas 20 anotações com:
- Tipo de feedback
- Sentimento
- Título e descrição
- Tags
- Nome do colaborador
- Data/hora

---

## 🔧 Scripts Úteis

### **Reiniciar Servidor:**
```
restart-server.bat
```

### **Abrir Dashboard:**
```
open-insights.bat
```

### **Testar APIs:**
```powershell
.\test-insights.ps1
```

---

## ⚠️ Se Não Aparecer o Menu

1. **Limpar cache do navegador:**
   - Ctrl + Shift + Del
   - Marcar "Cached images and files"
   - Clear data

2. **Verificar console (F12):**
   ```javascript
   document.getElementById('insights-section')
   ```
   - Se retornar `null` = problema
   - Se retornar HTML = está lá, só escondido

3. **Verificar se servidor está rodando:**
   ```
   http://localhost:3000/health
   ```

---

## 🌐 URL de Produção (Vercel)

Após deploy:
```
https://navigator-gules.vercel.app/dashboard.html
```

Mesmo procedimento:
1. Abrir URL
2. Ctrl + Shift + R
3. Clicar em "💡 Insights"

---

## 📞 Suporte

Se encontrar problemas:
1. Execute `.\test-insights.ps1`
2. Veja qual teste falhou
3. Verifique os logs do servidor
4. Consulte `BUGS_CORRIGIDOS.md`

---

**🎉 Aproveite o novo Dashboard de Insights!**

