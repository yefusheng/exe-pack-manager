module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
    const ThemeSchema = new Schema({
        title: String, // 标题
        note: String, // 备注
        brand: String, // 品牌颜色
        primary: String, // 主要颜色 使用于header
        secondary: String, // 次要颜色 使用于footer
        createDate: Date, // 创建时间
        updateDate: Date, // 修改时间
    });
    ThemeSchema.pre('save',  function (next) {
        console.log(this.updateDate);
        next();
    });
    return mongoose.model('Theme', ThemeSchema);
};
