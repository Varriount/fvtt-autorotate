import * as core from "./core.js";

//// Settings ////
const settings = {
    version: "",
    defaultRotationMode: "regular"
}

Hooks.on('ready', () => {
    core.registerSettings(
        settings,
        {
            version: {
                scope: "world"
            },

            defaultRotationMode: {
                name: "Default Rotation Mode",
                hint: "The rotation mode used for tokens that do not have " +
                      "automatic rotation explicitly enabled or disabled.",
                scope: "world",
                config: true,
                choices: {
                    "regular"  : "Regular",
                    "automatic": "Automatic",
                },
            }
        },
    );
})


//// Utility Functions ////


const UP = 'ArrowUp';
const DOWN = 'ArrowDown';
const LEFT = 'ArrowLeft';
const RIGHT = 'ArrowRight';
const SHIFT = 'Shift';


function shouldRotate(tokenDocument){
    const enabled = tokenDocument.flags[core.MODULE_SCOPE]?.['enabled']
    return (
        (
            enabled === true
        ) || (
            enabled == null &&
            settings.defaultRotationMode === 'automatic'
        )
    )
}


function rotationOffset(tokenDocument){
    const ret = tokenDocument.flags[core.MODULE_SCOPE]?.['offset'];
    if (ret == null) return 0;
    return ret;
}


async function rotateViaRotation(deltaX, deltaY, document, update, offset){
    // Convert our delta to an angle, then adjust for the fact that the
    // rotational perspective in Foundry is shifted 90 degrees
    // counterclockwise.
    update.rotation = core.normalizeDegrees(
        core.pointToAngle(deltaX, deltaY) - 90 + offset
    );
}


//// Hooks ////


async function rotateTokenOnPreUpdate(tokenDocument, change, options, userId) {
    const cont = (
        userId === game.user.id &&
        // autorotate.enabled can be in 3 states: true, false, and undefined.
        // undefined means "use the global default".
        shouldRotate(tokenDocument)
    )
    if (!cont){
        return;
    }

    // At least one part of the token's location must be changing.
    // If a coordinate isn't defined in the set of data to update, we default
    // to the token's current position.
    const newX = change.x || tokenDocument.x;
    const newY = change.y || tokenDocument.y;
    if (newX === tokenDocument.x && newY === tokenDocument.y) {
        return;
    }

    const deltaX = newX - tokenDocument.x;
    const deltaY = newY - tokenDocument.y;

    const offset = rotationOffset(tokenDocument);

    await rotateViaRotation(deltaX, deltaY, tokenDocument, change, offset)

    const STOP_MOVEMENT = (
        game.keyboard.downKeys.has(SHIFT) &&
        (
            game.keyboard.downKeys.has(UP)   ||
            game.keyboard.downKeys.has(DOWN) ||
            game.keyboard.downKeys.has(LEFT) ||
            game.keyboard.downKeys.has(RIGHT)
        )
    );
    if (STOP_MOVEMENT) {
        change.x = undefined;
        change.y = undefined;
    }
}


async function rotateTokensOnTarget(user, targetToken, targetActive) {
    const cont = (
        targetActive             &&
        user.id === game.user.id
    )
    if (!cont){
        return;
    }

    // The user must have at least one token controlled
    const controlled = canvas.tokens.controlled;
    if (controlled.length === 0) {
        return;
    }

    const updates = controlled
        .filter(t => shouldRotate(t.document))
        .filter(t => t.id !== targetToken.id)
        .map(controlledToken => ({
            _id: controlledToken.id,
            rotation: core.pointToAngle(
                targetToken.document.x - controlledToken.document.x,
                targetToken.document.y - controlledToken.document.y
            ) - 90 + rotationOffset(t.Data)
        }));
    await canvas.scene.updateEmbeddedDocuments("Token", updates);
}


async function injectAutoRotateOptions(app, html, data){
    const enabled = data.object.flags[core.MODULE_SCOPE]?.["enabled"]
    const offset = data.object.flags[core.MODULE_SCOPE]?.["offset"]
    const form = html.find("div[data-tab='appearance']:first");
    let snippet = await renderTemplate(
        "modules/autorotate/templates/token-config-snippet.html",
        {
            selectDefault: enabled == null,
            selectYes    : enabled === true,
            selectNo     : enabled === false,
            offsetToSet  : offset,
        }
    );
    form.append(snippet);
}

Hooks.on("preUpdateToken",    rotateTokenOnPreUpdate);
Hooks.on("targetToken",       rotateTokensOnTarget);
Hooks.on("renderTokenConfig", injectAutoRotateOptions);
