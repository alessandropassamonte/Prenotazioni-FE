# Desk Booking System - Frontend

Applicazione Angular 18 per la gestione delle prenotazioni di postazioni di lavoro con mappe interattive.

## 🚀 Funzionalità Principali

- **Selezione Data**: Calendario interattivo per selezionare la data della prenotazione
- **Selezione Piano**: Switch tra Piano 1 e Piano 3
- **Mappa Interattiva**: Visualizzazione real-time delle postazioni disponibili/occupate
- **Prenotazione Rapida**: Click sulla postazione verde per prenotare immediatamente
- **Gestione Prenotazioni**: Visualizza, cancella, check-in/out delle tue prenotazioni
- **UI Responsive**: Design ottimizzato per desktop, tablet e mobile

## 📋 Prerequisiti

- Node.js 18.x o superiore
- npm 9.x o superiore
- Angular CLI 18.x

## 🛠️ Installazione

1. **Installa le dipendenze:**
   ```bash
   npm install
   ```

2. **Configura l'API Backend:**
   Modifica il file `src/environments/environment.ts` se il backend non è su localhost:8080
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8080/api'
   };
   ```

3. **Aggiungi le immagini delle mappe:**
   Posiziona le immagini dei piani in:
   - `public/images/piano_1.jpg` (Mappa Piano 1)
   - `public/images/piano_3.jpg` (Mappa Piano 3)

## 🎯 Avvio dell'Applicazione

### Modalità Development
```bash
npm start
# oppure
ng serve
```

L'applicazione sarà disponibile su `http://localhost:4200`

### Build per Production
```bash
npm run build
# oppure
ng build --configuration production
```

I file compilati saranno in `dist/desk-booking-frontend`

## 📁 Struttura del Progetto

```
src/
├── app/
│   ├── components/          # Componenti riutilizzabili
│   │   ├── date-selector/   # Selettore data
│   │   ├── floor-selector/  # Selettore piano
│   │   ├── floor-map/       # Mappa interattiva
│   │   └── booking-list/    # Lista prenotazioni
│   ├── pages/               # Pagine principali
│   │   ├── home-page/       # Home
│   │   ├── booking-page/    # Pagina prenotazione
│   │   └── my-bookings-page/# Le mie prenotazioni
│   ├── services/            # Servizi API
│   │   ├── floor.service.ts
│   │   ├── desk.service.ts
│   │   └── booking.service.ts
│   ├── models/              # Modelli TypeScript
│   │   ├── floor.model.ts
│   │   └── booking.model.ts
│   ├── app.component.ts     # Componente root
│   ├── app.routes.ts        # Configurazione routing
│   └── app.config.ts        # Configurazione app
├── environments/            # Configurazioni ambiente
├── assets/                  # Assets statici
└── styles.scss             # Stili globali
```

## 🎨 Stack Tecnologico

- **Framework**: Angular 18 (Standalone Components)
- **UI Framework**: ngx-bootstrap + Bootstrap 5
- **Icone**: Bootstrap Icons
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router
- **State Management**: RxJS

## 🔌 Integrazione con Backend

L'applicazione si integra con il backend Spring Boot attraverso le seguenti API:

### Floors
- `GET /api/floors` - Lista piani
- `GET /api/floors/active` - Piani attivi
- `GET /api/floors/{id}/statistics?date={date}` - Statistiche piano

### Desks
- `GET /api/desks/available?date={date}&floorId={id}` - Postazioni disponibili

### Bookings
- `GET /api/bookings/user/{userId}/upcoming` - Prenotazioni future utente
- `POST /api/bookings/user/{userId}` - Crea prenotazione
- `DELETE /api/bookings/{id}` - Cancella prenotazione
- `POST /api/bookings/{id}/check-in` - Check-in
- `POST /api/bookings/{id}/check-out` - Check-out

## 🎯 Utilizzo

### 1. Prenotare una Postazione

1. Vai alla pagina "Prenota"
2. Seleziona una data dal calendario
3. Scegli il piano (Piano 1 o Piano 3)
4. Visualizza la mappa interattiva:
   - 🟢 Verde = Disponibile (cliccabile)
   - 🔴 Rosso = Occupata (non cliccabile)
5. Clicca su una postazione verde
6. Conferma la prenotazione nel modal

### 2. Gestire le Prenotazioni

1. Vai alla pagina "Le Mie Prenotazioni"
2. Visualizza tutte le tue prenotazioni future
3. Azioni disponibili:
   - ✅ Check-in (solo il giorno della prenotazione)
   - ⬅️ Check-out (dopo il check-in)
   - ❌ Cancella (prenotazioni attive)

## 🎨 Personalizzazione

### Colori
Modifica le variabili in `src/styles.scss`:
```scss
:root {
  --primary-color: #3498db;
  --secondary-color: #2c3e50;
  --success-color: #27ae60;
  --danger-color: #e74c3c;
}
```

### Layout Postazioni
Modifica i metodi `generateFloor1Layout()` e `generateFloor3Layout()` in `floor-map.component.ts` per personalizzare le posizioni delle postazioni sulla mappa.

## 🐛 Troubleshooting

### Backend non raggiungibile
Verifica che:
- Il backend Spring Boot sia avviato su `http://localhost:8080`
- Le credenziali CORS siano configurate correttamente nel backend
- L'URL API in `environment.ts` sia corretto

### Immagini mappe non visualizzate
Assicurati che le immagini siano in:
- `public/images/piano_1.jpg`
- `public/images/piano_3.jpg`

### Errori di compilazione
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install
```

## 📦 Dipendenze Principali

```json
{
  "@angular/core": "^17.0.0",
  "ngx-bootstrap": "^12.0.0",
  "bootstrap": "^5.3.0",
  "rxjs": "~7.8.0"
}
```

## 🚀 Prossimi Sviluppi

- [ ] Autenticazione e autorizzazione (JWT)
- [ ] Filtri avanzati (per dipartimento, attrezzatura)
- [ ] Notifiche push per promemoria
- [ ] Export prenotazioni in PDF/Excel
- [ ] Dashboard amministrativa con analytics
- [ ] Dark mode
- [ ] Internazionalizzazione (i18n)

## 📝 Note per lo Sviluppo

- Usa `userId = 1` come valore di default (TODO: implementare auth service)
- Le coordinate delle postazioni sulla mappa sono calcolate automaticamente ma possono essere personalizzate
- Il componente usa SVG per rendering ottimale delle postazioni sulla mappa
- Tutti i componenti sono standalone (no NgModule)

## 📄 Licenza

Copyright © 2025 Company. Tutti i diritti riservati.

## 👥 Supporto

Per domande o problemi:
- Email: it@company.com
- Issue Tracker: GitHub Issues

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Ottobre 2025
