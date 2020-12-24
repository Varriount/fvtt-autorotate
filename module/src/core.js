export const MODULE_SCOPE = 'autorotate';

/* ------------------------------------------------------------------------- */

export function getSetting(key){
    return game.settings.get(MODULE_SCOPE, key);
}


export function setSetting(key, value){
    return game.settings.set(MODULE_SCOPE, key, value);
}


export function registerSetting(key, value){
    const typ = value.type;
    if (value?.type?.prototype instanceof FormApplication) {
        return game.settings.registerMenu(MODULE_SCOPE, key, value);       
    }
    return game.settings.register(MODULE_SCOPE, key, value);
}


export function registerSettings(settings){
    for (const [key, value] of Object.entries(settings)){
        registerSetting(key, value);
    }
}


export async function getFlag(entity, flag, defaults){
    let result = entity.getFlag(MODULE_SCOPE, flag)
    if (result === undefined){
        setFlag(entity, defaults)
        result = defaults;
    }
    return result
}

export function setFlag(entity, flag, value){
    return entity.setFlag(MODULE_SCOPE, flag, value)
}


// Helper functions for math operations.
export function pointToAngle(x, y, snap){
    let angle = toDegrees(Math.atan2(y, x));
    if (snap != null && snap > 0){
        angle = Math.round(angle / snap) * snap;
    }
    return angle;
}

export function angleToPoint(angle, radius){
    let x = Math.cos(toRadians(angle)) * radius;
    let y = Math.sin(toRadians(angle)) * radius;
}

export function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
