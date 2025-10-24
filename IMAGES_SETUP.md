# Istruzioni per le Immagini delle Mappe

## 📸 Posizionamento Immagini

Le immagini delle mappe dei piani devono essere posizionate nella directory `public/images/`:

1. Crea la directory se non esiste:
   ```
   public/
   └── images/
       ├── piano_1.jpg
       └── piano_3.jpg
   ```

2. Copia le immagini fornite:
   - `Mappa_Piano_1.jpg` → rinomina in `piano_1.jpg`
   - `Mappa_Piano_3.jpg` → rinomina in `piano_3.jpg`

## 🎨 Formato Immagini Consigliato

- **Formato**: JPG o PNG
- **Risoluzione**: 1200x700 px (o proporzioni simili 12:7)
- **Dimensione**: < 500KB per ottimizzare il caricamento
- **Qualità**: Media-Alta (70-85% per JPG)

## 🔧 Come Preparare le Immagini

Se hai bisogno di ridimensionare o ottimizzare le immagini:

### Usando ImageMagick (CLI):
```bash
# Ridimensiona mantenendo proporzioni
convert Mappa_Piano_1.jpg -resize 1200x700 public/images/piano_1.jpg

# Con compressione
convert Mappa_Piano_1.jpg -resize 1200x700 -quality 80 public/images/piano_1.jpg
```

### Usando Photoshop/GIMP:
1. Apri l'immagine
2. Image → Image Size → 1200x700 px
3. File → Export As → JPEG (Quality 80%)
4. Salva come `piano_1.jpg` o `piano_3.jpg`

### Usando Online Tools:
- [TinyPNG](https://tinypng.com/) - Per compressione
- [ResizeImage.net](https://resizeimage.net/) - Per ridimensionamento

## ⚙️ Alternativa: Usa le Immagini Originali

Se preferisci usare le immagini originali senza modifiche, assicurati solo di:
1. Copiarle nella directory `public/images/`
2. Rinominarle correttamente:
   - Piano 1 → `piano_1.jpg`
   - Piano 3 → `piano_3.jpg`

L'applicazione le caricherà automaticamente con opacità ridotta (30%) come sfondo per la mappa interattiva SVG.

## 🎯 Verifica

Dopo aver posizionato le immagini:
1. Avvia l'applicazione: `npm start`
2. Vai su "Prenota"
3. Seleziona una data
4. Scegli un piano
5. Dovresti vedere la mappa come sfondo semi-trasparente con i cerchi delle postazioni sopra

## 🐛 Troubleshooting

**Immagine non visualizzata?**
- Verifica il nome file esatto (case-sensitive)
- Verifica che sia nella directory `public/images/`
- Controlla la console del browser per errori 404
- Prova a fare hard refresh (Ctrl+F5 o Cmd+Shift+R)

**Immagine troppo grande?**
- Ottimizzala con gli strumenti sopra
- Target: < 500KB per buone performance

---

**Nota**: Le immagini originali fornite dal progetto sono già nella giusta dimensione e qualità. Basta copiarle e rinominarle!
