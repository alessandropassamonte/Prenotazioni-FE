# 🚀 Quick Start Guide

Guida rapida per avviare l'applicazione Desk Booking System Frontend.

## ⚡ Start in 5 Minuti

### 1. Installa Node.js (se non installato)
- Scarica da: https://nodejs.org/
- Versione richiesta: 18.x o superiore
- Verifica installazione:
  ```bash
  node --version
  npm --version
  ```

### 2. Installa Dipendenze
```bash
npm install
```
⏱️ Tempo stimato: 2-3 minuti

### 3. Configura Immagini Mappe
```bash
# Crea directory
mkdir -p public/images

# Copia le immagini dei piani
# (Vedi IMAGES_SETUP.md per dettagli)
cp /path/to/Mappa_Piano_1.jpg public/images/piano_1.jpg
cp /path/to/Mappa_Piano_3.jpg public/images/piano_3.jpg
```

### 4. Avvia Backend (se non già avviato)
Assicurati che il backend Spring Boot sia in esecuzione:
```bash
cd ../desk-booking-system
mvn spring-boot:run
```
Backend disponibile su: http://localhost:8080

### 5. Avvia Frontend
```bash
npm start
```
⏱️ Compilazione iniziale: ~30 secondi

Frontend disponibile su: **http://localhost:4200**

## 🎉 Fatto!

Apri il browser su http://localhost:4200 e inizia a usare l'applicazione!

## 📋 Checklist Rapida

- [ ] Node.js 18+ installato
- [ ] Dipendenze installate (`npm install`)
- [ ] Immagini mappe in `public/images/`
- [ ] Backend Spring Boot avviato (porta 8080)
- [ ] Frontend avviato (porta 4200)
- [ ] Browser aperto su http://localhost:4200

## 🔧 Comandi Utili

```bash
# Avvia development server
npm start

# Build per production
npm run build

# Controlla errori TypeScript
ng build --configuration development

# Pulisci cache Angular
rm -rf .angular/cache

# Reinstalla dipendenze
rm -rf node_modules package-lock.json && npm install
```

## 🎯 Primo Test

1. Vai su http://localhost:4200
2. Click su "Prenota Ora"
3. Seleziona una data (oggi o futuro)
4. Scegli "PRIMO PIANO" o "TERZO PIANO"
5. Visualizza la mappa con postazioni verdi (disponibili) e rosse (occupate)
6. Click su una postazione verde per prenotare
7. Conferma la prenotazione
8. Vai su "Le Mie Prenotazioni" per vedere la tua prenotazione

## ❓ Problemi Comuni

### Porta 4200 già in uso
```bash
# Usa una porta diversa
ng serve --port 4300
```

### Backend non raggiungibile
- Verifica che il backend sia avviato su porta 8080
- Controlla console browser per errori di rete
- Verifica CORS configurato nel backend

### Immagini non visualizzate
- Verifica percorso: `public/images/piano_1.jpg` e `piano_3.jpg`
- Nomi file case-sensitive
- Hard refresh browser (Ctrl+F5)

### Errori di compilazione
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json .angular
npm install
```

## 📚 Documentazione Completa

- README.md - Documentazione principale
- IMAGES_SETUP.md - Setup immagini mappe
- Backend: ../desk-booking-system/README.md

## 💡 Suggerimenti

1. **Hot Reload**: Le modifiche al codice si ricaricano automaticamente
2. **DevTools**: Usa F12 per vedere console e network requests
3. **Componenti**: Esplora `src/app/components/` per capire la struttura
4. **API**: Vedi `src/app/services/` per le chiamate backend

## 🚀 Prossimi Passi

Dopo aver testato l'applicazione:
1. Personalizza i colori in `src/styles.scss`
2. Aggiungi la tua autenticazione
3. Personalizza le posizioni desk nella mappa
4. Aggiungi nuove funzionalità

---

**Buon lavoro! 🎉**

Per supporto: it@company.com
