function requestHandler(method, url, data, successCallback) {

    if(data && method === 'GET') {
        var queryArray = [];
        $.each(data, function (key, value) {
            queryArray.push(key + '=' + value);
        });
        if(/\?/g.test(url)) {
            url += '&' + queryArray.join('&');
        } else {
            url += '?' + queryArray.join('&');
        }
        data = null;
    }

    $.ajax({
        type: method,
        url: url,
        contentType: 'application/json',
        data: data?JSON.stringify(data):data,
        success: function (res) {
            if (res && res.success) {
                successCallback && successCallback(res.data);
            }
        },
        error: function (error) {
            if(error && error.responseJSON) {
                toast(error.responseJSON.msg);
            } else {
                toast('请求失败');
            }
        }
    });
}

function toast(text, timeout) {
    var time = timeout || 1000;
    var dom = $('<div class="toast-container"><div class="toast">'+text+'</div></div>');
    $("body").append(dom);
    setTimeout(function () {
        dom.remove();
    }, time)
}

function formatDate(date) {
    function getNumber(number) {
        return number > 9 ? 10 : '0'+number;
    }
    var theDay = new Date(date);
    return theDay.getFullYear() + '-' + getNumber(theDay.getMonth() + 1) + '-' + getNumber(theDay.getDate())

}
function login() {
    var result = {};
    result.userId = $("#loginForm input[name='userId']").val();
    result.password = CryptoJS.MD5($("#loginForm input[name='password']").val()).toString();
    $.ajax({
        type: 'POST',
        url: "/api/v1/login",
        contentType: 'application/json',
        data: JSON.stringify(result),
        success: function (res) {
            if (res && res.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                window.location.href = 'home';
            }
        },
        error: function (error) {
            alert(error.msg);
        }
    });
}

function logout() {
    $.ajax({
        type: 'POST',
        url: "/public/logout",
        contentType: 'application/json',
        data: JSON.stringify({}),
        success: function (res) {
            if (res && res.success) {
                localStorage.removeItem('token');
                window.location.href = 'login';
            }
        },
        error: function (error) {
            alert(error.msg);
        }
    });
}

function getAppId () {
    $.ajax({
        type: 'POST',
        url: "https://sso.exexm.com/qrlogin.ashx?t=apply",
        contentType: 'application/json',
        data: JSON.stringify({}),
        success: function (res) {
            try {
                res = JSON.parse(res);
                if (res && res.success) {
                    $("#qrCodeLogin img").attr('src', 'https://sso.exexm.com/qrlogin.ashx?t=img&qrApplyId='+res.qrApplyId).show();
                    startLoginTimer(res.qrApplyId);
                }
            } catch (e) {
                alert(e);
            }
        },
        error: function (error) {
            alert(error.msg);
        }
    });
}

var _longPolling = function (url, data, onsuccess, onerror) {
    var timeout = 5000; //毫秒
    var t_start = 0;

    var _schedule = function () {
        var t_now = (new Date()).getTime();
        var delta = t_now - t_start;
        if (delta > timeout) {
            _run();
        }
        else {
            timeoutHander= setTimeout(_run, delta);
        }
    }

    var _run = function () {
        t_start = (new Date()).getTime()
        var ajax = $.ajax({
            timeout: timeout,
            url: url,
            method: 'POST',
            data: JSON.stringify(data),
            contentType: "multipart/form-data",
            dataType: 'json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept-Language", 'zh-CN');
            },
            success: function (result, status, req) {
                if(result && result.code == 201) {
                    //重新连接
                    _schedule();
                }
                else {
                    if (onsuccess) onsuccess(result);
                }

            },
            error: function (req, error) {
                console.log('_longPolling error:' + JSON.stringify(error));
                if (error == 'timeout') {
                    _schedule();
                }
                else {
                    if (onerror) onerror(req, error);
                }
            }

        });
    };
    _schedule();
};

function startLoginTimer(qrApplyId) {
    _longPolling(
        'https://sso.exexm.com/qrlogin.ashx?t=listen&v=2&qrApplyId=' + qrApplyId,
        {qrApplyId: qrApplyId, version: 2},
        function (data) {
            if (data && data.success) {
                if (data.code === 200) {
                    createUser(qrApplyId, data.ticket);
                }
                if (data.code === 202) {
                    console.log(data);
                    $("#qrCodeLogin").html('已经扫描，等待App确认登录<br /><br /><img class="avatar" src="'+data.photoUrl+'" />');
                    startLoginTimer(qrApplyId);
                }
            }
        },
        function (e) {
            alert(e);
        });
}

function createUser(qrApplyId, ticket) {
    $.ajax({
        type: 'GET',
        url: "/api/v1/login?qrApplyId=" + qrApplyId + "&ticket=" + ticket,
        contentType: 'application/json',
        data: '',
        success: function (res) {
            if (res && res.success) {
                localStorage.setItem('token', res.data.token);
                window.location.href = 'home';
            }
        },
        error: function (error) {
            alert(error.msg);
        }
    });
}

function showLoginForm(dom) {
    $("#loginForm").show()
    $(dom).parents(".message").hide()
}

function showQrCode() {
    $("#qrCodeLogin").parents(".message").show()
    $("#loginForm").hide()
}

function getMenuUser() {
    try {
        var user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        toast(e);
        return
    }
    if(user) {
        $("#userMenu > span").html(user.name + ', 你好！');
    }
}

$(document).ready(function () {
    $('.ui.login-form').form({
        fields: {
            email: {
                identifier: 'email',
                rules: [
                    {
                        type: 'empty',
                        prompt: '输入邮箱'
                    },
                    {
                        type: 'email',
                        prompt: '请输入合法的邮箱'
                    }
                ]
            },
            password: {
                identifier: 'password',
                rules: [
                    {
                        type: 'empty',
                        prompt: '请输入你的密码'
                    },
                    {
                        type: 'length[6]',
                        prompt: '密码不能少于6位'
                    }
                ]
            }
        }
    });
    $('#loginForm').submit(function (e) {
        login();
        e.preventDefault();
    })
});


