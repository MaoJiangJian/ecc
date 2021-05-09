//base64转换成为utf-8编码的文本
function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}
//服务器通过get请求跳转到其他页面，为了保证数据没有被篡改，服务器需要进行加密。
//服务器通过公钥把相关的数据进行加密之后，公开私钥。只有公钥加密过的数据才能被私钥解密。否则就是被篡改
//服务器的公钥需要绝对的保密，不能告诉任何人。
//获取get请求中的参数
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return decodeURI(r[2]);
    return null;
}

function qfh(str) {
    str = str.replace(/\[|]/g, ''); //去除[]
    str = str.replace(/\"/g, ""); //出去""
    str = str.replace(/\s+/g, "");   //去除空格
    var array = str.split(",")
    return array;
}

$(function () {

    $("#sub").click(function () {
        var str = sessionStorage.getItem("all")
        let formData = new FormData(document.getElementById("upform"));
        formData.append("member", str)
        // let backgroundUrl = "http://127.0.0.1:5000/upload/";
        let backgroundUrl = "http://yb.zjhzcc.edu.cn/ecc/upload/";
        $.ajax({
            type: 'POST',
            data: formData,
            url: backgroundUrl,
            processData: false,
            contentType: false,
            success: function (data) {
                if (data["code"] == 200) {
                    swal("完成", "提交完成！", 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 3000);
                    return;
                }
                if (data["code"] == 722) {
                    swal("提交失败", "成员信息缺失，请重新检查！", 'error');
                    return;
                }
                if (data["code"] == 723) {
                    swal("提交失败", "队长学号异常，请重新检查！", 'error');
                    return;
                }
                if (data["code"] == 724) {
                    swal("提交失败", "联系方式异常，请重新检查！", 'error');
                    return;
                }
                if (data["code"] == 498) {
                    swal("信息有误", "您的信息有误，请仔细检查！", 'error')
                    return;
                }
                if (data["code"] == 444) {
                    swal("信息有误", "填写的内容不正确！", 'error')
                    return;
                }
                if(data["code"] == 736){
                    swal("该队长未注册队伍信息，请先注册",'error')
                }
            }
        });

    });

});

