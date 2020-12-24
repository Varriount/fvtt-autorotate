import * as core from "./core.js";

// Settings
Hooks.on('init', () => {
    // registerSettings({
    //     // "rotateWhenMouseMoved": {
    //     //     name: "Mouse Movement Can Rotate Tokens",
    //     //     hint: "Should auto-rotate tokens rotate when moved via the mouse?",
    //     //     scope: "client",
    //     //     type: Boolean,
    //     //     default: true,
    //     // },
    //     // "rotateWhenKeyMoved": {
    //     //     name: "Arrow Key Movement Can Rotate Tokens",
    //     //     hint: "Should auto-rotate tokens rotate when moved via the arrow keys?",
    //     //     scope: "client",
    //     //     type: Boolean,
    //     //     default: true,
    //     // },
    //     // "rotateWhenAiming": {
    //     //     name: "Selected Tokens Rotate Towards Targets",
    //     //     hint: "Should selected auto-rotate tokens rotate towards selected targets?",
    //     //     scope: "client",
    //     //     type: Boolean,
    //     //     default: true,
    //     // },

    //     // "inplaceRotationKey": {
    //     //     name: "Keyboard Key to Allow In-Place Rotation",
    //     //     hint: "Keyboard key that must be held down to prevent token movement (but not rotation).",
    //     //     scope: "client",
    //     //     type: String,
    //     //     default: "Shift",
    //     // },

    //     // "actorDefaults": {
    //     //   name: "Auto-Rotation Defaults",
    //     //   label: "Per-Actor-Type Auto-Rotation Defaults",
    //     //   hint: "Configure default auto-rotation settings for actor types.",
    //     //   icon: "fas fa-bars",
    //     //   type: AutoRotationDefaultsApplication,
    //     //   restricted: true  
    //     // }
    // });
})

/* ------------------------------------------------------------------------- */
const UP = 'ArrowUp';
const DOWN = 'ArrowDown';
const LEFT = 'ArrowLeft';
const RIGHT = 'ArrowRight';
const SHIFT = 'Shift';

const DIRECTION_ALIAS = {
    0:   "down",
    90:  "right",
    180: "up",
    270: "left",
    360: "down",
}


async function getRotationImages(path){
    // Modified version of wildcard file handler
    // Takes a path, and finds files that have a degree suffix.
    const degreeSuffixRegex = /\b(\d+)(\.[^.])$/
    const degreeSuffixPattern = path.replace(/\.[^.]$/, "*$&")

    const browseOptions = { wildcard: true };

    // Support S3 matching
    if ( /\.s3\./.test(pattern) ) {
      source = "s3";
      const {bucket, keyPrefix} = FilePicker.parseS3URL(pattern);
      if ( bucket ) {
        browseOptions.bucket = bucket;
        pattern = keyPrefix;
      }
    }

    // Retrieve wildcard content
    let tokenImages = undefined;
    try {
      const content = await FilePicker.browse(source, pattern, browseOptions);
      tokenImages = content.files;
    } catch(err) {
      tokenImages = [];
      ui.notifications.error(err);
    }

    // Retrieve only paths with numeric suffixes
    return tokenImages.filter(i => i.match(degreeSuffixRegex))
}


async function rotateViaRotation(deltaX, deltaY, data, update){
    // Convert our delta to an angle, then adjust for the fact that the
    // rotational perspective in Foundry is shifted 90 degrees
    // counterclockwise.  
    update.rotation = core.pointToAngle(deltaX, deltaY) - 90;
}

async function rotateViaImages(deltaX, deltaY, data, update){
    // Attempt to retrieve cached images associated with token
    // If images aren't available, load them
    // Calculate rotation
    // Find image that has closest match to images
    // If image doesn't have an originalImage attribute, set it
}





async function rotateTokenOnPreUpdate(parent, data, update, options, userId) {
    const skip = !(
        userId === game.user.id &&
        (data.flags?.autorotate?.enabled || false)
    )
    if (skip){
        return;
    }

    // At least one part of the token's location must be changing.
    // If a coordinate isn't defined in the set of data to update, we default
    // to the token's current position.
    const updateX = update.x || data.x;
    const updateY = update.y || data.y;
    if (updateX == data.x && updateY == data.y) {
        return;
    }

    const deltaX = updateX - data.x;
    const deltaY = updateY - data.y;

    rotateViaRotation(deltaX, deltaY, data, update)

    const STOP_MOVEMENT = (
        game.keyboard.isDown(SHIFT) &&
        (
            game.keyboard.isDown(UP)   || 
            game.keyboard.isDown(DOWN) ||
            game.keyboard.isDown(LEFT) ||
            game.keyboard.isDown(RIGHT)
        )
    );
    if (STOP_MOVEMENT) {
        update.x = undefined;
        update.y = undefined;
    }
}


async function rotateTokensOnTarget(user, targetToken, targetActive) {
    const skip = !(
        targetActive             &&
        user.id === game.user.id
    )
    if (skip){
        return;
    }
    
    // The user must have at least one token controlled
    const controlled = canvas.tokens.controlled;
    if (controlled.length == 0) {
        return;
    }

    const updates = controlled
        .filter(t => t.id != targetToken.id)
        .filter(t => t.getFlag(core.MODULE_SCOPE, "enabled"))
        .map(controlledToken => ({
            _id: controlledToken.data._id,
            rotation: core.pointToAngle(
                targetToken.data.x - controlledToken.data.x,
                targetToken.data.y - controlledToken.data.y
            ) - 90
        }));

    canvas.tokens.updateMany(updates);
}


async function injectAutoRotateOptions(app, html, data){
    const form = html.find("div[data-tab='position']:first");
    let snippet = await renderTemplate(
        "modules/autorotate/templates/token-config-snippet.html",
        {enabled: data.object.flags.autorotate?.enabled}
    );
    form.append(snippet);
}

Hooks.on("preUpdateToken", rotateTokenOnPreUpdate);
Hooks.on("targetToken", rotateTokensOnTarget);
Hooks.on("renderTokenConfig", injectAutoRotateOptions);