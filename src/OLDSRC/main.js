require("./main.scss");

function widthAdjust() {
  var checkImg = $(".project img:visible").first();
  $(".project-text").css({width:checkImg.width()+"px"});
  $("#portrait-label").css({width:$("#about img").outerWidth()+"px"});
}

$(document).ready(function() {
  // Label width adjust
  $(window).on("load resize", widthAdjust);
  $("#project-modal").on("shown.bs.modal hidden.bs.modal", widthAdjust);

  // Project buttons
  $("#projects .btn").on("click", function() {
    $("#projects .btn").removeClass("active");
    $(this).addClass("active");
    if($(this).text() === "All") {
      $(".project").show();
    }
    else if($(this).text() === "jQuery Demos") {
      $(".project").hide();
      $(".jquery").show();
    }
    else if($(this).text() === "Websites") {
      $(".project").hide();
      $(".website").show();
    }
  });

  // Vary Modal Content
  $("#project-modal").on("show.bs.modal", function (event) {
    var trigger = $(event.relatedTarget);
    var title = trigger.find("span").text();
    var link = trigger.data("link");
    var parentDiv = trigger.parent();

    $("#project-modal img").attr("src",trigger.find("img").attr("src"));
    $("#project-modal .modal-title").text(title);
    $("#project-modal a.btn").attr("href",link);

    $(".project-description").hide();
    if(parentDiv.hasClass("medleys")) {
      $(".medleys").show();
      $(".website").show();
    }
    if(parentDiv.hasClass("website"))
      $(".website").show();
    if(parentDiv.hasClass("api"))
      $(".api").show();
  });
});
