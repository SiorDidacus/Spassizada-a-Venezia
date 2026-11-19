# Spassizada a Venezia

Piccolo gioco mobile (9:16) in pixel-art per imparare il veneto: un gondoliere
cammina lungo una salizada veneziana e, a ogni incontro (gato, cocal, carega,
fogo, feral), occorre scrivere il nome dell'oggetto in veneto. Risposta giusta:
si riparte. Sbagliata: splash in acqua!

## Modalità

- **normale** — la vignetta mostra l'indizio e occorre scrivere il nome
  dell'oggetto in veneto.
- **esperto** — "le parole no le gavarà indreture": la vignetta non mostra la
  frase d'indizio, solo l'oggetto disegnato.
- **esplora** — "le parole le te vien mostrà direttamente, senza competizion":
  la vignetta mostra subito il nome dell'oggetto con il suo indizio e un
  bottone "Va vanti" riprende la camminata. Nessun punteggio, nessuno splash.

## Sviluppo

    npm install
    npm run dev      # server locale
    npm run build    # build di produzione in dist/

## Pubblicazione

Il workflow .github/workflows/deploy.yml pubblica automaticamente il gioco
su GitHub Pages a ogni push su main. Attiva Pages da:
Settings > Pages > Source: GitHub Actions.

## Struttura

- src/App.tsx — tutta la logica di gioco (per ora in un unico file)
- public/sprites/ — qui andranno i PNG della pixel-art (vedi README interno)
- .github/workflows/deploy.yml — deploy automatico su GitHub Pages
