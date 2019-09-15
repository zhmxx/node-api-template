import { UserTokenModel } from "../Model/UserTokenModel";
import { JsonRpcError } from "tian-jsonrpc";
import { ObjectID } from "mongodb";
import { Config } from "../Config";
import { UserModel } from "../Model/UserModel";
import { Md5 } from "ts-md5/dist/md5";
let xml2js = require('xml2js');
import * as RequestPromise from "request-promise";

export class Util {
    static async checkToken(params) {
        if (!params.token) {
            throw new JsonRpcError(1001, '您尚未登录，请登录');
        }

        //为了测试方便，测试环境不检查是否登录
        if (!Config.prod) {
            return new ObjectID(params.token);
        }
        
        let userToken = await UserTokenModel.collection().findOne({ token: params.token });
        if (!userToken) {
            userToken = await UserTokenModel.collection().findOne({ token: new ObjectID(params.token) });
        }
        if (!userToken) {
            throw new JsonRpcError(1001, '您尚未登录，请登录');
        }

        // 刷新token
        let tokenModel = new UserTokenModel(userToken);
        tokenModel.save();

        return userToken.user_id;
    }

    /**
     * 获取Object数组里某个key值的数组
     */
    static getArrayOf(arr: Object[], key: string) {
        let ret = [];
        for (let i = 0; i < arr.length; i++) {
            ret.push(arr[i][key]);
        }
        return ret;
    }

    static getPager(params) {
        let page = params.page ? params.page : 1;
        let pageSize = Number(params.pageSize ? params.pageSize : Config.defaultPageSize);
        return { skip: (page - 1) * pageSize, limit: pageSize };
    }

    /**
     * 数组转为以某个值为key的Object
     */
    static arrayToObject(arr: Object[], key: string) {
        let ret = {};
        for (let i = 0; i < arr.length; i++) {
            ret[arr[i][key]] = arr[i];
        }
        return ret;
    }

    /**
     * Object的values转为Array
     */
    static objectToArray(obj: Object) {
        let ret = [];
        for (let key in obj) {
            ret.push(obj[key]);
        }
        return ret;
    }

    /**
     * 生成token
     * @param phone 手机号
     */
    static async generateToken(phone: string, type?: string) {
        let user;
        if (!type) {
            user = await UserModel.collection().findOne({ phone: phone });
        }
        let userTokenModel = new UserTokenModel();
        userTokenModel.user_id = user._id;
        userTokenModel.token = user._id.toString();
        userTokenModel.save();
        return userTokenModel.token;
    }

    /**
     * Json对象转xml字符串
     * @param jsonObj 
     * @param xml2js.Builder.rootName 构建的xml字符串根节点
     * @param xml2js.Builder.headless 为true则不包含头部
     * @param xml2js.Builder.allowSurrogateChars
     * @param xml2js.Builder.cdata 用CDATA包裹节点值
     * @param xml2js.Builder.renderOpts.pretty 是否添加换行符
     * xml2js的详细参数：https://github.com/Leonidas-from-XIV/node-xml2js
     */
    static json2xml(jsonObj) {
        var builder = new xml2js.Builder({ rootName: 'xml', headless: true, allowSurrogateChars: true, cdata: true, renderOpts: {pretty: false} });
        return builder.buildObject(jsonObj);
    }

    /**
     * xml字符串转Json对象
     * @param xmlStr 
     * @param callback 
     * @param parseString.explicitArray 是否把子节点当作数组
     */
    static xml2json(xmlStr, callback) {
        xml2js.parseString(xmlStr, { explicitArray: false }, callback);
    }

    /**
     * 生成MD5值
     * @param str 要加密的字符串
     */
    static md5(str) {
        let result = Md5.hashStr(str);
        if (typeof result == 'string') {
            return result;
        } else {
            return '';
        }
    }

    /**
     * 判断两个Array是否相等，仅适用于基本类型（string, number, boolean）的单层Array
     */
    static arrayEquals(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2) || arr1.length != arr2.length) {
            return false;
        }
        for (let i = 0; i < arr1.length; i++) {
            if (['string', 'number', 'boolean'].indexOf(typeof arr1[i]) === -1
                || ['string', 'number', 'boolean'].indexOf(typeof arr2[i]) === -1
                || arr1[i] !== arr2[i]) {
                    return false;
                }
        }
        return true;
    }

    static sha1(input: string) {
        let crypto = require('crypto'), shasum = crypto.createHash('sha1');;
        shasum.update(input);
        return shasum.digest('hex');
    }

    /**
     * 二维数组找到所有组合，如：
     * [[1, 2], [3, 4]]
     * 结果为：[[1, 3], [1, 4], [2, 3], [2, 4]]
     * @param arr 二维数组
     */
    static allPossibleCases(arr) {
        if (arr.length == 1) {
            return arr[0];
        } else {
            var result = [];
            var allCasesOfRest = Util.allPossibleCases(arr.slice(1));  // recur with the rest of array
            for (var i = 0; i < allCasesOfRest.length; i++) {
                for (var j = 0; j < arr[0].length; j++) {
                    result.push(arr[0][j] + ' ' + allCasesOfRest[i]);
                }
            }
            return result;
        }
    }

    /**
     * 校验银行卡号及银行是否一致
     * @param bank      银行
     * @param card_no   卡号
     */
    static async checkBankCard(bank, card_no) {
        let bankMap = {"CDB":"国家开发银行","ICBC":"中国工商银行","ABC":"中国农业银行","BOC":"中国银行","CCB":"中国建设银行","PSBC":"中国邮政储蓄银行","COMM":"交通银行","CMB":"招商银行","SPDB":"上海浦东发展银行","CIB":"兴业银行","HXBANK":"华夏银行","GDB":"广东发展银行","CMBC":"中国民生银行","CITIC":"中信银行","CEB":"中国光大银行","EGBANK":"恒丰银行","CZBANK":"浙商银行","BOHAIB":"渤海银行","SPABANK":"平安银行","SHRCB":"上海农村商业银行","YXCCB":"玉溪市商业银行","YDRCB":"尧都农商行","BJBANK":"北京银行","SHBANK":"上海银行","JSBANK":"江苏银行","HZCB":"杭州银行","NJCB":"南京银行","NBBANK":"宁波银行","HSBANK":"徽商银行","CSCB":"长沙银行","CDCB":"成都银行","CQBANK":"重庆银行","DLB":"大连银行","NCB":"南昌银行","FJHXBC":"福建海峡银行","HKB":"汉口银行","WZCB":"温州银行","QDCCB":"青岛银行","TZCB":"台州银行","JXBANK":"嘉兴银行","CSRCB":"常熟农村商业银行","NHB":"南海农村信用联社","CZRCB":"常州农村信用联社","H3CB":"内蒙古银行","SXCB":"绍兴银行","SDEB":"顺德农商银行","WJRCB":"吴江农商银行","ZBCB":"齐商银行","GYCB":"贵阳市商业银行","ZYCBANK":"遵义市商业银行","HZCCB":"湖州市商业银行","DAQINGB":"龙江银行","JINCHB":"晋城银行JCBANK","ZJTLCB":"浙江泰隆商业银行","GDRCC":"广东省农村信用社联合社","DRCBCL":"东莞农村商业银行","MTBANK":"浙江民泰商业银行","GCB":"广州银行","LYCB":"辽阳市商业银行","JSRCU":"江苏省农村信用联合社","LANGFB":"廊坊银行","CZCB":"浙江稠州商业银行","DYCB":"德阳商业银行","JZBANK":"晋中市商业银行","BOSZ":"苏州银行","GLBANK":"桂林银行","URMQCCB":"乌鲁木齐市商业银行","CDRCB":"成都农商银行","ZRCBANK":"张家港农村商业银行","BOD":"东莞银行","LSBANK":"莱商银行","BJRCB":"北京农村商业银行","TRCB":"天津农商银行","SRBANK":"上饶银行","FDB":"富滇银行","CRCBANK":"重庆农村商业银行","ASCB":"鞍山银行","NXBANK":"宁夏银行","BHB":"河北银行","HRXJB":"华融湘江银行","ZGCCB":"自贡市商业银行","YNRCC":"云南省农村信用社","JLBANK":"吉林银行","DYCCB":"东营市商业银行","KLB":"昆仑银行","ORBANK":"鄂尔多斯银行","XTB":"邢台银行","JSB":"晋商银行","TCCB":"天津银行","BOYK":"营口银行","JLRCU":"吉林农信","SDRCU":"山东农信","XABANK":"西安银行","HBRCU":"河北省农村信用社","NXRCU":"宁夏黄河农村商业银行","GZRCU":"贵州省农村信用社","FXCB":"阜新银行","HBHSBANK":"湖北银行黄石分行","ZJNX":"浙江省农村信用社联合社","XXBANK":"新乡银行","HBYCBANK":"湖北银行宜昌分行","LSCCB":"乐山市商业银行","TCRCB":"江苏太仓农村商业银行","BZMD":"驻马店银行","GZB":"赣州银行","WRCB":"无锡农村商业银行","BGB":"广西北部湾银行","GRCB":"广州农商银行","JRCB":"江苏江阴农村商业银行","BOP":"平顶山银行","TACCB":"泰安市商业银行","CGNB":"南充市商业银行","CCQTGB":"重庆三峡银行","XLBANK":"中山小榄村镇银行","HDBANK":"邯郸银行","KORLABANK":"库尔勒市商业银行","BOJZ":"锦州银行","QLBANK":"齐鲁银行","BOQH":"青海银行","YQCCB":"阳泉银行","SJBANK":"盛京银行","FSCB":"抚顺银行","ZZBANK":"郑州银行","SRCB":"深圳农村商业银行","BANKWF":"潍坊银行","JJBANK":"九江银行","JXRCU":"江西省农村信用","HNRCU":"河南省农村信用","GSRCU":"甘肃省农村信用","SCRCU":"四川省农村信用","GXRCU":"广西省农村信用","SXRCCU":"陕西信合","WHRCB":"武汉农村商业银行","YBCCB":"宜宾市商业银行","KSRB":"昆山农村商业银行","SZSBK":"石嘴山银行","HSBK":"衡水银行","XYBANK":"信阳银行","NBYZ":"鄞州银行","ZJKCCB":"张家口市商业银行","XCYH":"许昌银行","JNBANK":"济宁银行","CBKF":"开封市商业银行","WHCCB":"威海市商业银行","HBC":"湖北银行","BOCD":"承德银行","BODD":"丹东银行","JHBANK":"金华银行","BOCY":"朝阳银行","LSBC":"临商银行","BSB":"包商银行","LZYH":"兰州银行","BOZK":"周口银行","DZBANK":"德州银行","SCCB":"三门峡银行","AYCB":"安阳银行","ARCU":"安徽省农村信用社","HURCB":"湖北省农村信用社","HNRCC":"湖南省农村信用社","NYNB":"广东南粤银行","LYBANK":"洛阳银行","NHQS":"农信银清算中心","CBBQS":"城市商业银行资金清算中心"};

        let url = 'https://ccdcapi.alipay.com/validateAndCacheCardInfo.json?cardNo=' + card_no + '&cardBinCheck=true';
        let response = await RequestPromise({
            method: 'GET',
            uri: url
        });
        response = JSON.parse(response);
        if (!response.bank || bankMap[response.bank] !== bank) {
            throw JsonRpcError.alert('银行卡信息有误');
        }
    }

    /**
     * 将Mongo中的ISODate类型转换为字符串
     * @param isoDate Mongo中的日期类型
     * @returns 日期字符串，格式如：2017-06-25 16:51:17
     */
    static ISODateToString(isoDate, justDay = false) {
        return justDay ? isoDate.toLocaleDateString() : isoDate.toLocaleString();
    }

    /**
     * 数组转为value:count的object
     */
    static arrayToCountableObject(arr) {
        if (!arr || !Array.isArray(arr)) {
            return;
        }
        let obj = {};
        arr.forEach(e => {
            if (!(e in obj)) {
                obj[e] = 0;
            }
            obj[e] ++;
        });
        return obj;
    }

    /**
     * 判断object是否为空
     */
    static isEmptyObject(obj) {
        return JSON.stringify(obj) === '{}';
    }

    /**
     * 判断是否合法数字
     */
    static isValidNumber(n) {
        return (typeof n === 'number') && !isNaN(n);
    }

    /**
     * 判断是否是ObjectID
     */
    static isObjectID(v) {
        let tmp = v;
        if (typeof tmp !== 'string') {
            try {
                tmp = tmp.toString();
            } catch (e) {
                return false;
            }
        }
        return new RegExp("^[0-9a-fA-F]{24}$").test(tmp);
    }

    /**
     * 生成Mongo地理位置对象
     * @param s 坐标字符串，形如 12.34,56.78
     */
    static toMongoGeoObject(s) {
        let a = s.split(',');
        if (!Array.isArray(a) || a.length !== 2) {
            throw JsonRpcError.alert('地理位置信息错误');
        }
        a.forEach(e => {
            e = Number(e);
        });
        return {
            type: 'Point',
            coordinates: [Number(a[0]), Number(a[1])]
        };
    }

    /**
     * 经纬度获得城市信息
     * @param lng 经度
     * @param lat 纬度
     */
    static async getCity(lng, lat) {
        let url = `https://api.map.baidu.com/geocoder?location=${lat},${lng}&coord_type=gcj02&output=json`;
        let response = await RequestPromise({
            method: 'GET',
            uri: url
        });
        response = JSON.parse(response);
        console.log(response);

        if (response.status !== 'OK'
            || !response.result || !response.result.addressComponent || !response.result.addressComponent.city) {
            throw JsonRpcError.alert('定位城市失败，请手动选择');
        }

        return response.result.addressComponent.city;
    }

    /**
     * 数组结构转换为树形结构
     * @param array         待转换的数组
     * @param parent        父节点，用于递归
     * @param parent_field  parent字段的名字，默认为parent_id
     * @returns 树形结构的object，有唯一跟节点
     */
    static unflatten(array, parent = undefined, parent_field = 'parent_id') {
        let tree = {};
        if (!parent) {
            parent = array.find(a => a[parent_field] === null);
        }

        let children = array.filter( child => String(child[parent_field]) == String(parent._id));

        if( children.length !== 0  ){
            if( parent[parent_field] === null ){
                tree = parent;   
            }
            parent['children'] = children;
            children.forEach(child => { Util.unflatten( array, child ) });                 
        }

        return tree;
    }

    static isNullOrUndefined(p) {
        return ((typeof p === 'object' && String(p) === 'null') || typeof p === 'undefined');
    }
}