
export function createConfirmModal(cb) {
    let text = prompt("Es-tu vraiment certain de vouloir supprimer cette Action/Reaction ?\nEcrit \"Kaben\" ou \"Simon\" pour confirmer la suppression.")

    if ([ "kaben", "simon" ].includes(text.toLowerCase()))
        return cb();
}
