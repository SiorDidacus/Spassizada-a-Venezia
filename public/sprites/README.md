# Cartella sprite

Qui vanno i PNG della pixel-art, organizzati così:

    public/sprites/
      gondoliere/   walk_0.png, walk_1.png, fall.png
      oggetti/      gato.png, cocal.png, carega.png, fogo.png, feral.png
      scena/        facciata_1.png, trifora.png, basoli.png, acqua.png

Regole:
- 1 pixel del PNG = 1 pixel logico del gioco (canvas 216x384)
- sfondo trasparente, nessun anti-aliasing
- punto d'ancoraggio: bordo inferiore-centrale (l'oggetto poggia sulla salizada)
- i frame di animazione devono avere tutti la stessa identica dimensione
