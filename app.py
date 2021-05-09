import datetime
import os
import re
import pymysql
import random
from flask import Flask, redirect, request, jsonify


from flask_cors import CORS

'''
这是一个函数，它可以获取文件的格式名称
'''


def getFileFormat(fileName):
    fileName = str(fileName)
    return fileName.split('.')[1]


app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024

CORS(app, supports_credentials=True)
'''
  这里定义了几个要传回的参数
  ok代表正常
  lack代表数据缺少
  invalid代表数据不合法
  bad代表有人故意插入了坏东西(js脚本或者sql注入)
  '''

badPhone = {"code": 724, "message": "手机号码异常"}
badId = {"code": 723, "message": "学号异常"}
lackData = {"code": 722, "message": "成员信息未填"}
lackFile = {"code": 477, "message": "未选择上传的文件"}
oversize = {"code": 476, "message": "上传的文件过大"}
invalidData = {"code": 498, "message": "不合规的参数"}
badData = {"code": 444, "message": "请勿尝试"}
okData = {"code": 200, "message": "OK"}
formatError = {"code": 735, "message": "文件命名格式错误"}
noTeam = {"code": 736, "message": "数据库中无此队长学号"}


#对上传文件接收
@app.route('/uploadFile', methods=['POST'])
def upload_view():
    if request.method == 'POST':
        uploadedFiles = request.files.get('file')
        if uploadedFiles.filename == '':
            print(1)
            return jsonify(lackFile)
        fileName = uploadedFiles.filename
        pattern = r'^\d*'
        reslut = re.search(pattern, fileName)

        print(reslut.group(0))
        print(len(reslut.group(0)))
        if(len(reslut.group(0)) != 10):
            return jsonify(formatError)
        #数据查询队长学号正确
        db = pymysql.connect(host="localhost", user="root",
                             password="hzkjzyjsxy", database="ecc")
        cur = db.cursor()
        capId = cur.execute(
            "SELECT * FROM subfile_time where caption_id = %s", reslut.group(0))
        db.commit()
        print(capId)
        if(capId == 0):
            return jsonify(noTeam)
        cur.execute(
            "INSERT INTO subfile_time(caption_id) VALUES(%s)", reslut.group(0))
        db.commit()
        db.close()
        filePath = "./word/" + reslut.group(0)
        print(filePath)
        uploadedFiles.save(filePath)
    return jsonify(okData)


@app.route('/upload', methods=['POST'])
def recieve():
    # 获取表单数据
    form_dict = dict(request.form)
    checkBad = list(form_dict.values())
    print(checkBad)
    if(len(checkBad) < 19):
        return jsonify(lackData)
    for i in checkBad:
        if "script" in str(i):
            return jsonify(badData)
        elif "delete" in str(i):
            return jsonify(badData)
    #对上传的数据进行处理 分类
    work_name = checkBad[0]
    team_name = checkBad[1]
    email = checkBad[2]
    caption_name = checkBad[3]
    caption_id = checkBad[4]
    if (len(checkBad[4]) != 10):
        return jsonify(badId)
    phone_number = checkBad[5]
    if (len(checkBad[5]) != 11):
        return jsonify(badPhone)
    teacher_information = '老师1：' + \
        checkBad[8]+checkBad[9]+' 老师2：'+checkBad[10]+checkBad[11]
    member_information = checkBad[18]
    submit = [work_name, team_name, email, caption_name, caption_id,
              phone_number, teacher_information, member_information]

    # 时间戳:年-月-日-时-分-秒
    db = pymysql.connect(host="localhost", user="root",
                         password="hzkjzyjsxy", database="ecc")
    cur = db.cursor()
    cur.execute(
        "insert into submit_information(work_name,team_name,email,caption_name,caption_id,phone_number,teacher_information,member_information,submit_time)values (%s,%s,%s,%s,%s,%s,%s,%s,CURRENT_TIMESTAMP() )", submit)
    db.commit()
    db.close()

    return jsonify(okData)


if __name__ == '__main__':
    app.run()
