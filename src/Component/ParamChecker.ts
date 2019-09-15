import { Util } from "./Util";

interface CheckStringOptions {
    canBeEmpty?: boolean;
    canBeUndefined?: boolean;
    maxLength?: number;
    fixedLength?: number;
}
const defaultCheckStringOptions: CheckStringOptions = {
    canBeEmpty: false,
    canBeUndefined: false,
    maxLength: undefined,
    fixedLength: undefined
};

export class ParamChecker {
    /**
     * 检查是否合法的ObjectID
     * @param p 待检查变量
     * @param checkType 是否判断类型，如果为true，则p必须为ObjectID类型结果才为true
     */
    static checkObjectID(p, checkType: boolean = false): boolean {
        if (!Util.isObjectID(p)
            || (checkType && typeof p === 'string')) {
            return false;
        }
        return true;
    }

    /**
     * 检查string是否合法
     * @param p
     * @param opts 选项
     */
    static checkString(p, opts: CheckStringOptions = {}): boolean {
        const o = {
            ...defaultCheckStringOptions,
            ...opts
        }
        if (o.canBeUndefined && typeof p === 'undefined') return true;
        if (typeof p !== 'string') return false;
        if (!o.canBeEmpty && p.length === 0) return false;
        if (typeof o.maxLength !== 'undefined' && p.length > o.maxLength) return false;
        if (typeof o.fixedLength !== 'undefined' && p.length !== o.fixedLength) return false;
        return true;
    }

    /**
     * 检查手机号是否合法
     */
    static checkPhone(p) {
        if (!ParamChecker.checkString(p)) return false;
        if (p.length !== 11) return false;
        if (!Util.isValidNumber(Number(p))) return false;
        return true;
    }
}