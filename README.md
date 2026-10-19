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

Pour afficher d'autres données sans reconstruire l'image, monter son propre fichier `data.yaml` (voir ci-dessous), et son fichier de contour s'il en a un :

```sh
docker run --rm -p 8080:80 \
  -v "$PWD/mes-donnees.yaml:/usr/share/nginx/html/touraine_map/data.yaml:ro" \
  -v "$PWD/mon-contour.geojson:/usr/share/nginx/html/touraine_map/mon-contour.geojson:ro" \
  touraine_map
```

## Le fichier de données `data.yaml`

Les lieux affichés sur la carte ne sont pas écrits dans le code : ils sont lus au chargement de la page dans le fichier `public/data.yaml`. Pour présenter d'autres lieux, il suffit de modifier ou de remplacer ce fichier :

- en développement (`npm run dev`), modifier `public/data.yaml` puis recharger la page ;
- après `npm run build`, le fichier est copié dans `dist/data.yaml`, qu'on peut modifier directement sur le serveur sans recompiler ;
- avec Docker, monter son fichier comme indiqué ci-dessus.

### Exemple

```yaml
title: Expo SAT
outline: departement-37-indre-et-loire.geojson

locations:
  - id: "1"
    name: L'Île-Bouchard
    coordinates: {lat: 47.124, lng: 0.4273}
    description: Apparition de la Vierge Marie
    year: 1947
    wikidataUrl: https://www.wikidata.org/wiki/Q3581712

  - id: "2"
    name: Chambray-lès-Tours
    coordinates: {lat: 47.33879, lng: 0.71419}
    description: "Eglise Saint Symphorien : statue de sainte Apolline"
    year: 1200
```

### Format

À la racine du fichier :

| Clé | Obligatoire | Description |
|---|---|---|
| `title` | non | Titre de l'onglet du navigateur. |
| `outline` | non | Fichier GeoJSON du contour de la zone, relatif à `data.yaml` (ou URL complète). Sans cette clé, aucun contour n'est dessiné. Le fichier doit être servi avec le site, par exemple placé dans `public/`. |
| `locations` | oui | Liste des lieux, dans l'ordre d'affichage de la liste. Au moins un lieu. |

Pour chaque lieu de `locations` :

| Clé | Obligatoire | Description |
|---|---|---|
| `id` | oui | Identifiant unique du lieu (texte ou nombre). |
| `name` | oui | Nom affiché sur la carte et dans la liste. |
| `coordinates` | oui | Position du lieu : `{lat: 47.39, lng: 0.68}`, en degrés décimaux. Utiliser un point, pas une virgule. |
| `description` | non | Texte affiché sous le nom dans la liste. |
| `year` | non | Année associée au lieu (nombre entier). |
| `wikidataUrl` | non | Lien vers la page Wikidata du lieu. |

Toute autre clé est refusée, pour repérer les fautes de frappe (`descripton` par exemple).

### Pièges du YAML

- Une valeur qui contient « `: ` » (deux-points suivi d'une espace) doit être mise entre guillemets : `description: "Fontaine Sainte-Marie : eau miraculeuse"`.
- Pour retirer temporairement un lieu, commenter ses lignes avec `#`.
- L'indentation compte : utiliser des espaces, pas des tabulations.

Si le fichier est absent ou invalide, la page affiche un message d'erreur qui indique le lieu et la clé en cause, à la place de la carte.


## Les données

Contour de l'Indre-et-Loire : https://www.data.gouv.fr/fr/datasets/carte-des-departements-2-1/ (https://www.data.gouv.fr/fr/datasets/r/f5bd2f40-3060-4ad7-a2e7-32304b83eb6e).

Liste des événements : Aurélien Mazany.

Coordonnées terrestres : OpenStreetMap, Wikidata et Wikipédia.