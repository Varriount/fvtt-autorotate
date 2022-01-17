import * as core from "./core.js";

// Settings
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

/* ------------------------------------------------------------------------- */
const UP = 'ArrowUp';
const DOWN = 'ArrowDown';
const LEFT = 'ArrowLeft';
const RIGHT = 'ArrowRight';
const SHIFT = 'Shift';

// const DIRECTION_ALIAS = {
//     0:   "down",
//     90:  "right",
//     180: "up",
//     270: "left",
//     360: "down",
// }


// function formatString(string, data){
//     // Formats a string according to the passed in data.
//     // The string supports the `{}` style of formatting, where a property
//     // enclosed in curly-braces is replaced with the value of the property
//     // from the passed in object. 
// }


// function findFiles(pattern){}

// function setTokenSprite(token, spritePath){
//     // Sets the token's sprite to the one pointed at the specified path.
// }

// function setTokenSpriteToAction(token, pattern, action){
//     // Sets the token's sprite to the one pointed to by the given pattern,
//     // after being formatted with the token's data.
//     // Available properties:
//     //   - "sprite-location"
//     //   - "sprite-filename"
//     //   - "sprite-extension"
//     //   - "action"
// }

// async function getRotationImages(path, pattern, action){
//     // Modified version of wildcard file handler
//     // Takes a path, a path pattern, and an action, and creates a new path from them.
//     const degreeSuffixRegex = /\b(\d+)(\.[^.])$/
//     const degreeSuffixPattern = path.replace(/\.[^.]$/, "*$&")

//     const browseOptions = { wildcard: true };

//     // Support S3 matching
//     if ( /\.s3\./.test(pattern) ) {
//       source = "s3";
//       const {bucket, keyPrefix} = FilePicker.parseS3URL(pattern);
//       if ( bucket ) {
//         browseOptions.bucket = bucket;
//         pattern = keyPrefix;
//       }
//     }

//     // Retrieve wildcard content
//     let tokenImages = undefined;
//     try {
//       const content = await FilePicker.browse(source, pattern, browseOptions);
//       tokenImages = content.files;
//     } catch(err) {
//       tokenImages = [];
//       ui.notifications.error(err);
//     }

//     // Retrieve only paths with numeric suffixes
//     return tokenImages.filter(i => i.match(degreeSuffixRegex))
// }

function shouldRotate(token_data){
    const enabled = token_data.flags[core.MODULE_SCOPE]?.['enabled']
    return (
        (
            enabled === true
        ) || (
            enabled == null &&
            settings.defaultRotationMode === 'automatic'
        )
    )
}

async function rotateViaRotation(deltaX, deltaY, document, update){
    // Convert our delta to an angle, then adjust for the fact that the
    // rotational perspective in Foundry is shifted 90 degrees
    // counterclockwise.  
    update.rotation = core.normalizeDegrees(
        core.pointToAngle(deltaX, deltaY) - 90
    );
}


// const pathToImageCache = new WeakMap()
// const tokenToImageCache = new WeakMap()


// async function rotateViaImages(deltaX, deltaY, document, data){
//     const token
//     // Attempt to retrieve cached images associated with token
//     // If images aren't available, load them
//     // Calculate rotation
//     // Find image that has closest match to images
//     // If image doesn't have an originalImage attribute, set it
// }


async function rotateTokenOnPreUpdate(token_document, change, options, userId) {
    const token_data = token_document.data
    const cont = (
        userId === game.user.id &&
        // autorotate.enabled can be in 3 states: true, false, and undefined.
        // undefined means "use the global default".
        shouldRotate(token_data)
    )
    if (!cont){
        return;
    }

    // At least one part of the token's location must be changing.
    // If a coordinate isn't defined in the set of data to update, we default
    // to the token's current position.
    const newX = change.x || token_data.x;
    const newY = change.y || token_data.y;
    if (newX === token_data.x && newY === token_data.y) {
        return;
    }

    const deltaX = newX - token_data.x;
    const deltaY = newY - token_data.y;

    await rotateViaRotation(deltaX, deltaY, token_data, change)

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
        .filter(t => shouldRotate(t.data))
        .filter(t => t.id !== targetToken.id)
        .map(controlledToken => ({
            _id: controlledToken.data._id,
            rotation: core.pointToAngle(
                targetToken.data.x - controlledToken.data.x,
                targetToken.data.y - controlledToken.data.y
            ) - 90
        }));
    await canvas.scene.updateEmbeddedDocuments("Token", updates);
}


async function injectAutoRotateOptions(app, html, data){
    const enabled = data.object.flags[core.MODULE_SCOPE]?.["enabled"]
    const form = html.find("div[data-tab='appearance']:first");
    let snippet = await renderTemplate(
        "modules/autorotate/templates/token-config-snippet.html",
        {
            selectDefault: enabled == null,
            selectYes    : enabled === true,
            selectNo     : enabled === false,
        }
    );
    form.append(snippet);
}

Hooks.on("preUpdateToken",    rotateTokenOnPreUpdate);
Hooks.on("targetToken",       rotateTokensOnTarget);
Hooks.on("renderTokenConfig", injectAutoRotateOptions);
