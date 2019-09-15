import { JsonRpcError } from "tian-jsonrpc";
import { Util } from "../Component/Util";

//参数校验
export class Jv {
    /**
     * 
     * @param params 待校验的参数
     * @param schema 校验规则
     * 
     * Schema example:
     * {
     *      required: [ 'xx', 'xx2' ],  //必传参数
     *      properties: {               //每个参数的校验规则
     *          xx: {
     *              type: 'string',     //参数类型：object, string, number, undefined, boolean, integer, ObjectID(字符串orObjectID类型的对象)
     *              numberLike: true,   //字符串的值为数字
     *              fixLength: 10,      //固定长度
     *              maxLength: 10,      //最大长度
     *              minLength: 5,       //最小长度
     *              fixVal: 'abcd',     //固定值
     *              range: [ 1, 10 ],   //数字范围，必须只有两个元素，且range[0]必须小于range[1]
     *          }
     *      },
     *      errorMessage: 'Bad parameter'
     * }
     */
    static validate(params, schema) {
        //检查required字段
        if (schema.required) {
            schema.required.forEach(element => {
                if (!(element in params) || params[element] === '') {
                    Jv.throwError(schema.errorMessage ? schema.errorMessage : '参数不能为空：' + element);
                }
            });
        }

        //检查每个字段
        for (let name in schema.properties) {
            if ((schema.required === undefined || !(name in schema.required)) 
                && !(name in params)) {
                continue;
            }

            let s = schema.properties[name];
            let v = params[name];
            let errMsg = schema.errorMessage;

            if (s.type) {
                if ([ 'object', 'string', 'number', 'undefined', 'boolean' ].indexOf(s.type) !== -1) {
                    Jv.assert(s.type === typeof v, errMsg);
                } else if (s.type === 'integer') {
                    Jv.assert(Number.isInteger(v), errMsg);
                } else if (s.type === 'ObjectID') {
                    Jv.assert(Util.isObjectID(v), name + ' should be type of ' + s.type);
                }
            }
            if (schema.properties[name].fixLength) {
                if (schema.properties[name].fixLength !== params[name].length) {
                    Jv.throwError(schema.errorMessage);
                }
            }
            if (schema.properties[name].minLength) {
                if (schema.properties[name].length > params[name].length) {
                    Jv.throwError(schema.errorMessage);
                }
            }
            if (schema.properties[name].maxLength) {
                if (schema.properties[name].length < params[name].length) {
                    Jv.throwError(schema.errorMessage);
                }
            }
            if (schema.properties[name].fixVal) {
                if (schema.properties[name].fixVal != params[name]) {
                    Jv.throwError(schema.errorMessage);
                }
            }
            if (schema.properties[name].numberLike) {
                Jv.assert(!isNaN(Number(params[name])), schema.errorMessage);
            }
            if (s.range) {
                Jv.assert(v >= s.range[0] && v <= s.range[1], errMsg);
            }
            if (s.in) {
                Jv.assert(s.in.indexOf(v) !== -1, errMsg);
            }
        }
    }

    static assert(cond, errMsg) {
        if (!cond) {
            Jv.throwError(errMsg);
        }
    }

    static throwError(errMsg) {
        errMsg = errMsg ? errMsg : '参数错误';
        throw JsonRpcError.alert(errMsg);
    }
}