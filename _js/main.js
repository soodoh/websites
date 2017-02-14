$(document).ready(function() {
  $(window).on("load resize", function() {

    // Change project windows height proportionally to width
    var imgHeight = $(".project-img").parent().height() + "px";
    var imgWidth = $(".project-img").parent().width() + "px";
    $(".project-temp").css("height",imgHeight, "width", imgWidth);
  });
});
