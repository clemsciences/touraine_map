# touraine_map

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Docker

Le `Dockerfile` compile le site avec Node, puis le sert avec nginx (configuration dans `docker/nginx.conf`).

Construire l'image :

```sh
docker build -t touraine_map .
```

Lancer le conteneur :

```sh
docker run --rm -p 8080:80 touraine_map
```

Le site est alors disponible sur http://localhost:8080/, qui redirige vers http://localhost:8080/touraine_map/. Le chemin `/touraine_map/` vient de l'option `base` de `vite.config.js` : si on la change, il faut aussi adapter le `Dockerfile` et `docker/nginx.conf`.

Pour le lancer en arrière-plan et le redémarrer automatiquement :

```sh
docker run -d --name touraine_map --restart unless-stopped -p 8080:80 touraine_map
```


## Les données

Contour de l'Indre-et-Loire : https://www.data.gouv.fr/fr/datasets/carte-des-departements-2-1/ (https://www.data.gouv.fr/fr/datasets/r/f5bd2f40-3060-4ad7-a2e7-32304b83eb6e).

Liste des événements : Aurélien Mazany.

Coordonnées terrestres : OpenStreetMap, Wikidata et Wikipédia.