## Introduction

L'AREA est un service en ligne qui permet aux utilisateurs de créer des connexions entre différents services web. Les utilisateurs peuvent créer des actions-réactions qui se déclenchent automatiquement en fonction d'un événement spécifique dans un service web et qui déclenchent une action dans un autre service web. Cette documentation technique vise à fournir des instructions détaillées sur la façon dont l'AREA fonctionne.

## Architecture

L'AREA est un service qui utilise une architecture en microservices. Le système est composé de plusieurs services autonomes qui interagissent entre eux via des interfaces de programmation d'application (API). Les services sont déployés dans des conteneurs Docker. Si vous rencontrez un soucis durant l'excécution vous pouvez vous référez au README.md pour connaître les commandes requises au lancement du projet, certaines fonctionnalités que l'on utilise pour la sécurité et la mise à l'échelle (Scalabilité) du projet nécessitent une commande qui est uniquement lancable manuellement.

### Backend

Le backend est divisé en quatre grandes parties :

-   Service d'authentification : gère l'authentification et l'autorisation des utilisateurs
-   Service de stockage de données : stocke les données de l'utilisateur, entre autre la configuration des actions réactions
-   Service de déclencheur : surveille les événements dans les services web connectés et déclenche les actions en conséquence
-   Service de gestion des erreurs : surveille les erreurs système et envoie des alertes en cas de dysfonctionnement

### API

AREA expose des API pour permettre aux développeurs de connecter leurs propres services web à la plateforme. Les API sont utilisées pour la configuration des actions-réactions et pour la communication entre les différents services.
Afin de voir les routes disponibles et les paramètres requis à son bon fonctionnement, une documentation auto-généré par Swagger est disponible via l'url `/api/api-docs/`

### Reverse Proxy

**BONUS:**
Nous utilisons un proxy inversé, c'est à dire que l'application est servi par un serveur web nginx qui redirige les requêtes sur le serveur du frontend ou de l'API lorsque le chemin de la requête commence par `/api`. Nous avons utilisé ce mécanisme pour éviter d'avoir à définir une configuration CORS (Cross-origin resource sharing) sur le service de l'API (backend). Cela permet non seulement d'éviter des erreurs de configurations qui pourrait avoir un impact important sur la sécurité des données des utilisateurs, mais également de regrouper les différents services accessibles sur la même origine. Même si cela n'est pas obligatoire dans le sujet, nous avons tenu à l'ajouter car cela permettrait de mettre en place un système de versionning de l'API et garantir la disponibilité lors de développement de nouvelles fonctionnalités. Toujours dans une perspective de scalabilité, pour un vrai projet professionel commercialisé.

### buildActionCache
**BONUS:**
**SYSTEME DE POLLING**

Nous disposons d'un object  `Bus` qui gère de façon simple et intuitive la déclenchement des actions et l'exécution des réactions. `buildActionCache` est une fonction qui permet de créer un système de polling dynamique et optimisé. `trigger` quant à elle, permet de déclencher les réactions associées à l'action que vous lui donnez en paramètre.

--- STRUCTURE

La fonction prend deux arguments. Le premier argument est une liste d'actions concernées par le système de polling et le deuxième un objet qui comporte trois méthodes, `onRun`, `onCompare`, `onChange`. Cet objet dispose d'une propriété `service` qui permet de définir le nom de l'application OAuth2 lié au système de polling et une deuxième propriété `require_auth` qui permet de définir si les actions spécifiés dans le premier argument requièrent une connexion OAuth2 valide.

Lors de l'exécution de la fonction, la méthode `onRun` sera exécutée une fois pour tous les utilisateurs qui disposent d'au moins une des `actions` spécifiées dans le premier argument ET qui disposent d'une connexion OAuth2 valide pour le service spécifié dans `service` si `require_auth` a été défini sur `true`.

La fonction renvoie une fonction qui devra être exécutée périodiquement dans un  `setInterval` par exemple.

--- FONCTIONNEMENT

A chaque exécution, le système exécute la méthode `onRun` avec en paramètre  `user` qui contient une propriété `application` référençant la connexion OAuth2 de l'utilisateur pour le service, ainsi qu'une propriété `reactions` qui contient la liste de toutes les `action-reaction` qui dépendent d'une des actions qui avaient été passés en premier argument à `buildActionCache`.

Dans cette fonction, qui peut être asynchrone, vous pouvez envoyer une requête vers le service OAuth2 cible et retourner la réponse. La méthode  `onCompare` sera en suite exécutée avec deux paramètres, `before` et `after`, qui correspondent respectivement à l'ancienne et la nouvelle réponse renvoyées par `onRun`.

Dans la méthode `onCompare` vous devez comparer les changements entre l'ancienne et la nouvelle réponse puis retourner les différences qui vous intéressent. Si `A` est retourné (un objet ou une liste en général),  la méthode `onChange` sera exécutée avec un premier argument `user` (même que celui de `onRun`) et l'objet `A` que vous avez retourné dans `onCompare` en deuxième argument !

Une fois dans `onChange` vous déclenchez les `actions-reactions` qui doivent être déclenchées. Si par exemple vous avez retournez une liste de nouveaux messages dans `onCompare`,  pour chaque action `on_receive_message` de `user.reactions` vous utiliserez `Bus.trigger(user, reaction, { MESSAGE_CONTENT: message })` pour déclencher les réactions associées à l'action. Le troisième paramètre devra être un objet comportant les différentes propriétés que l'utilisateur pourra utiliser en tant que variable dans les paramètres de ses réactions. Par exemple si `message` vaut `SALUT`, le paramètre  `Message: "$MESSAGE_CONTENT"` de la réaction suivante sera transformé par `Message: "SALUT"`.

**Note:** Une fois le cycle terminé, la nouvelle réponse de `onRun` qui avait été passé en tant que `after` à la méthode `onCompare` deviendra `before` lors de la prochaine exécution du cycle.


## About.json

Le service de l'API renvoie un fichier json contenant les informations en temps réel des différents services, actions, réactions, disponibles, ainsi que les différents paramètres de configuration pour chacune d'elles. D'autres informations complémentaires telles que la couleur, le nom, la description des services, l'adresse ip de l'utilisateur, sont également présentes dans le fichier qui est accessible via `/api/about.json`.

## Configuration d'une AREA

Les utilisateurs peuvent configurer des actions-réactions en utilisant l'interface web de l'AREA ou en utilisant l'application mobile. La configuration d'une actions-réactions se fait en deux étapes :

1.  Choix d'un déclencheur : l'utilisateur choisit un service web connecté et un événement spécifique qui déclenchera la réaction
2.  Choix d'une action : l'utilisateur choisit un autre service web connecté et une action spécifique qui sera exécutée lorsque le déclencheur s'activera.

**BONUS:** 
Les utilisateurs peuvent également utiliser des arguments dans les paramètres des actions réactions. Ces arguments dépendent des services et de la réaction sélectionnée et peuvent servir à afficher des messages personnalisés en fonction des informations renvoyées par le déclencheur (évènement).

### Les variables d'environnements disponibles
**BONUS:** Vous trouverez ici un dictionnaire des variables d'environnements disponibles pour le projet.
Vous pouvez les utilisés dans le champ `message` des paramètres de vos réactions.
- Discord :
  - Déclenché lorsque tu rejoins un serveur:  
    `$GUILD_NAME` renvoie le nom du serveur que vous avez rejoint.
    `$GUILD_ICON_URL` renvoie l'url du logo du serveur.
  - Déclenché lorsque tu quittes un serveur : `$GUILD_NAME` renvoie le nom du serveur que vous avez quitté et `$GUILD_ICON_URL` renvoie l'url du logo du serveur.
- GitHub :
  - Déclenché lorsqu'un commit est ajouté au repo:  
    `$REPO_NAME` renvoie le nom du repo.  
    `$REPO_URL` renvoie l'url du repo.  
    `$COMMIT_MESSAGE` renvoie le message du commit.  
    `$COMMIT_URL` renvoie l'url du commit.  
    `$COMMIT_AUTHOR_NAME` renvoie le nom de l'auteur du commit.  
    `$COMMIT_AUTHOR_EMAIL` renvoie l'adresse mail du profil de l'auteur du commit.
  - Déclenché lorsqu'une issue est ouverte sur le repo:  
    `$REPO_NAME` renvoie le nom du repo.  
    `$REPO_URL` renvoie l'url du repo.  
    `$ISSUE_TITLE` renvoie le title de l'issue.  
    `$ISSUE_URL` renvoie l'url de l'issue.  
    `$AUTHOR_NAME` renvoie le nom de l'auteur de l'issue.  
    `$AUTHOR_AVATAR_URL` l'url de l'avatar de l'auteur de l'issue.
  - Déclenché lorsqu'une pull request est ajoutée au repo:  
    `$REPO_NAME` renvoie le nom du repo.  
    `$REPO_URL` renvoie l'url du repo.  
    `$PULL_REQUEST_TITLE` renvoie le title de la pull request,  
    `$PULL_REQUEST_URL` renvoie l'url de la pull request.  
    `$AUTHOR_NAME` renvoie le nom de l'auteur de la PR.  
    `$AUTHOR_AVATAR_URL` l'url de l'avatar de l'auteur de la PR.  
- Spotify :
  - Déclenché lorsque tu écoutes une musique:  
    `$SONG_TITLE` renvoie le nom de la musique.  
    `$SONG_ARTIST` renvoie le nom de l'artiste.  
    `$SONG_ALBUM` renvoie le nom de l'album.
- Sommet :
  - Déclenché lorsque tu écoutes une musique:  
    `$SONG_TITLE` renvoie le nom de la musique.  
    `$SONG_ARTIST` renvoie le nom de l'artiste.  
    `$SONG_ALBUM` renvoie le nom de l'album.
- Twitch :
  - Déclenché lorsqu'un streamer est en live:  
    `$CHANNEL_NAME` renvoie le nom du streamer actuellement en live.
  - Déclenché lorsqu'un streamer n'est plus en live:  
    `$CHANNEL_NAME` renvoie le nom du streamer qui n'est plus en live.
  - Déclenché lorsqu'un utilisateur envoie un message dans le tchat:  
    `$CHANNEL_NAME` renvoie le nom du streamer.  
    `$MESSAGE_CONTENT` renvoie le message envoyé par l'utilisateur.  
    `$MESSAGE_AUTHOR` renvoie le nom de l'utilisateur qui a envoyé un message dans le chat.
- Animeo :
  - Déclenché lorsqu'un nouveau anime est disponible:  
    `$ANIME_TITLE` renvoie le titre de l'anime.  
    `$ANIME_SYNOPSIS` renvoie le synopsis de l'anime.  
  - Déclenché lorsqu'un nouveau épisode est disponible:  
    `$ANIME_TITLE` renvoie le titre de l'anime.  
    `$EPISODE_NUMBER` renvoie le numéro de l'épisode.  
    `$EPISODE_TITLE` renvoie le titre de l'épisode.  
    `$EPISODE_DESCRIPTION` renvoie la description de l'épisode.
  - Déclenché lorsque tu commences à regarder un anime:  
    `$ANIME_TITLE` renvoie le titre de l'anime.  
    `$EPISODE_NUMBER` renvoie le numéro de l'épisode.  
    `$EPISODE_TITLE` renvoie le titre de l'épisode.  

## Sécurité

Nous avons mis en place plusieurs mesures de sécurité pour protéger les données des utilisateurs :

-   Authentification : les utilisateurs doivent s'authentifier avant de pouvoir accéder à leur compte AREA
-   Hashage des mots de passes (**BONUS**) : ~~lorsqu'un un utilisateur s'inscrit via un mot de passe le mot de passe est hashé par le client par l'algorithme Argon2 qui est recommendé par l'ANSSI (Agence Nationale de la Sécurité des systèmes d'informations) depuis le 8 octobre 2021. La complexité de l'algorithme sur le CPU/GPU rend virtuellement impossible les attaques par brute force et rainbow table, qui visent à retrouver le mot de passe depuis un hash (Leak database).~~  
Nous avons décidé de ne pas utiliser d'algorithme de hashage pour les mots de passe car sur notre projet React-Native aucun packet était supporté, cela était fonctionnel sur le projet front mais nous avons décidé de le retirer pour ne pas perdre trop de temps sur ce problème. Nous avons essayé de recompiler nous même le packet mais par manque de temps nous avons décidé de le retirer entièrement du projet.
- Cohérence et atomicité de la base de donnée (**BONUS**) : Peu de personnes se préoccupent des problèmes de concurrences à un stade aussi précoce du développement "commercial" d'un projet et c'est justement ce qui en fait l'un des problèmes les plus complexes et couteux à résoudre sur le long terme. Lorsqu'un service devient populaire et commence à s'étendre (mise à l'échelle), une architecture comportant des problèmes de concurrences trop importants pourrait facilement obliger une équipe à repartir de zéro. Pour un service populaire, les problèmes de concurrences se font très vite ressentir et peuvent entraîner de lourdes conséquences sur la stabilité du service tels que des bugs extrêmement difficiles à identifier. Pour cette raison, nous avons imaginer et conçu notre architecture avec ce risque en tête. Nous avons scrupuleusement veillés à respecter le concept d'atomicité des données en créant des multi-index d'unicités, ainsi qu'utilisé les transactions MongoDB pour garantir les propriétés ACID (Atomicity, Consistency, Isolation, Durability) des collections sensibles. Cela prévient non seulement les problèmes de concurrences qui pourraient amenés à créer des duplicatas et entrées fantômes dans la base de données, mais également de préparer le terrain pour une mise à l'échelle horizontale (ou verticale) du service sans risque de concurrence. D'où le besoin de configurer le replica `rs0` pour lancer le projet.

## Configuration du backend

Premièrement, copiez le contenu du fichier `/back/.env.example` dans `/back/.env` et modifiez les identifiants des différents services OAuth2. **Attention, vous ne devez pas modifier les identifiants des services ANIMEO et SOMMET. Ces identifiants sont des identifiants de TEST fournis pour les développeurs. Pour pouvoir créer une application OAuth2 avec de vrais jetons il faut contacter les développeurs.** Ils sont entrain de refaire la page dédié aux développeurs.

Pour exécuter le projet sur votre machine ou sur un serveur distant il faudra configurer les variables de redirection dans le dossier `back/`.
```
WEB_APP_REDIRECT_URI=https://blackdata.fr/oauth
MOBILE_APP_REDIRECT_URI=myarea://oauth
```

Pour le mobile remplacé par `exp://192.168.0.16:19000/--/oauth` (voir URL par défaut exacte) en dev et `myarea://oauth` pour prod.
Pour la connexion OAuth2, il faut que le serveur redirige vers la bonne url à la fin de votre connexion.

## CI/CD
Nous avons mis en place des CI/CD nous permettant d'autogénerer la documentation API Swagger dès qu'un changement a lieu dans le dossier back. GitHub Action lance le script `back/src/swagger.js` qui génère le fichier `back/swagger_output.json` qui est ensuite utilisé par Swagger UI pour générer la documentation. Vous retrouverez la documentation à l'adresse `localhost/api/api-docs/`.
Un deuxième GitHub Action a été mis en place pour complier le projet mobile et prendre le .apk pour en faire un artifact disponible sur le dépôt GitHub. Concrètement cela permet de télécharger l'application mobile depuis le dépôt GitHub en ayant toujours la dernière version.
Le fonctionnement classique du téléchargement de l'application mobile en passant par `localhost/client.apk` est toujours disponible.

## Ajout d'un service

Dans le dossier `back/src/integrations` vous retrouvez tous les services disponibles, en partant d'un service, vous pourrez ajouter des services sans problème. En regardant la documentation du service que vous souhaitez implémenter, vous trouverez les informations nécessaires au bon fonctionnement tel que les requêtes API, ainsi que la connexion OAuth. Notre système est fait pour que chaque service soit linkable via l'OAuth, malheuresement les services qui ne supportent pas l'OAuth ne fonctionnera pas. Afin que le service soit joliement alimenté n'oubliez pas d'ajouter une icone dans le dossier `/assets/img/services/icon.svg`.
Ensuite indiquer le path dans le descriptor du service.

```JSON
{
    "name"      : "service",
    "has_oauth" : true,
    "disabled"  : false,
    "descriptor": {
        "design": {
            "label" : "Service",
            "color" : "#1DB954",
            "icon"  : "/assets/img/services/icon.svg"
        },
        "triggers": [
            {
                "name"          : "on_service_trigger",
                "description"   : "Déclenché lorsque le trigger est déclenché.",
                "require_auth"  : true,
                "params": {
                    "in"    : [],
                    "out"   : []
                }
            }
        ],
        "actions": [
            {
                "name"          : "do_service_action",
                "description"   : "Effectue une action sur ce service lorsqu'un trigger est déclenché.",
                "require_auth"  : false,
                "params": {
                    {
                      "name"      : "param_name",
                      "type"      : "string",
                      "required"  : true
                    },
                }
            }
        ]
    }
}
```

## Bonus supplémentaires

[Bonus #1: Reverse Proxy](#reverse-proxy)  
[Bonus #2: Système et utilitaire de polling](#buildactioncache)  
[Bonus #3: Variables des réactions](#les-variables-denvironnements-disponibles)  
[Bonus #4: Atomicité et concurrence. Concept ACID de la base de données.](#sécurité)  
[Bonus #5: CI/CD](#cicd)

> **Annexe**: Nous avons développés notre propre librairie pour envoyer des requêtes HTTP/HTTPS. Elle est disponible sur Github. [`L-U-M-Z/APIs`](https://github.com/L-U-M-Z/APIs).


## Conclusion

AREA est un service cloud basé sur l'architecture en microservices qui permet aux utilisateurs de créer des connexions entre différents services web. Les utilisateurs peuvent configurer des applets qui se déclenchent automatiquement en fonction d'un événement spécifique dans un service web et qui déclenchent une action dans un autre service web.
