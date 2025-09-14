import $ from 'jquery';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

if (urlParams.get("d") == 1) {
    setTimeout(() => {
        $(".login-without-google-btn").click()
        setTimeout(() => {
            $("#option-community").click()
            setTimeout(() => {
                $("#option-community-build").click()
            }, 100);
        }, 100);
    }, 100);
}
