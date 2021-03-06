// import version as manifestVersion from '../module.json';
//
export const MODULE_SCOPE = 'autorotate';
// export const VERSION = manifestVersion;
/* ------------------------------------------------------------------------- */

export function getSetting(key){
    return game.settings.get(MODULE_SCOPE, key);
}


export function setSetting(key, value){
    return game.settings.set(MODULE_SCOPE, key, value);
}


export function registerSetting(key, value, link){
    const typ = value.type;
    if (value?.type?.prototype instanceof FormApplication) {
        return game.settings.registerMenu(MODULE_SCOPE, key, value);       
    }

    const originalOnChange = value.onChange;
    if (link != null) {
        if (originalOnChange != null) {
            value.onChange = function (v) {
                link[key] = v;
                originalOnChange(v);
            }
        } else {
            value.onChange = function (v) {
                link[key] = v;
            }
        }
    }

    if (value.default === undefined && link[key] !== undefined){
        value.default = link[key]
    }

    const result = game.settings.register(MODULE_SCOPE, key, value);
    if (value.onChange != null){
        value.onChange(getSetting(key));
    }
    return result;
}


export function registerSettings(link, settings){
    for (var [key, value] of Object.entries(settings)){
        registerSetting(key, value, link);
    }
}


export async function getFlag(doc, flag, defaults){
    let result = doc.getFlag(MODULE_SCOPE, flag)
    if (result === undefined){
        setFlag(document, defaults)
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

export function toDegrees(radians) {
  return radians / (Math.PI / 180);
};


export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
};


export function normalizeDegrees(degrees) {
  const delta = degrees % 360;
  return delta < 0 ? delta + 360 : delta;
}

export function normalizeRadians(radians) {
  let pi2 = 2 * Math.PI;
  let nr = (radians + pi2) % pi2;
  return (nr > Math.PI) ? nr - pi2 : nr;
}