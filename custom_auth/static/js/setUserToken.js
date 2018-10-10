$(document).ready(function(){
    function csrfSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", $('input[name="csrfmiddlewaretoken"]').val());
            }
        }
    });


    var url = window.location.href;

    function getCode(url) {
        return url.split("code=")[1].split('#')[0]
    }

    var code = getCode(url);

    $.ajax({
        type: "POST",
        url: "/api/login/social/token/",
        data: JSON.stringify({
            "provider": "facebook",
            "code": code,
            "redirect_uri": "http://localhost:8000/auth/facebook/redirect"
        }),
        complete: function(){
            window.location.href = "/";
        },
        contentType: "application/json",
        cache: false,
        success: function(data){
            localStorage.setItem('UserToken', 'Token ' + data['token']);
            console.log(data);
        },
        error: function(xhr){
            console.log(xhr);
        }
    });
});