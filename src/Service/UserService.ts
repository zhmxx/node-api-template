import { UserModel } from "../Model/UserModel";
import { ParamChecker } from "../Component/ParamChecker";

export class UserService {
    /**
     * 创建新用户
     * @param params 用户属性
     */
    static async createUser(params): Promise<boolean|string> {
        let ret: boolean|string = true;
        if (!ParamChecker.checkPhone(params.phone)) {
            return '手机号有误';
        }
        (typeof params.nick !== 'string') && (params.nick = '');
        (typeof params.real_name !== 'string') && (params.real_name = '');
        (typeof params.avatar !== 'string') && (params.avatar = '');
        let exist = await UserModel.collection().findOne({phone: params.phone});
        if (exist) {
            return '手机号已被占用';
        }

        let userModel = new UserModel({
            phone: params.phone,
            nick: params.nick,
            real_name: params.real_name,
            avatar: params.avatar,
            balance: 0,
            status: 1,
        });
        await userModel.save();

        return ret;
    }
}