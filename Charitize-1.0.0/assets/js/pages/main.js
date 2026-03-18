(function ($) {
  "use strict";

  // Spinner
  var spinner = function () {
    setTimeout(function () {
      if ($("#spinner").length > 0) {
        $("#spinner").removeClass("show");
      }
    }, 1);
  };
  spinner();

  // Initiate the wowjs
  if (typeof WOW !== 'undefined') {
    new WOW().init();
  } else {
    console.warn("WOW library not loaded. Animations may be disabled.");
  }

  // ── Sticky Navbar ──────────────────────────────────────
  var mobileMenuIsOpen = false;
  var lastScrollTop = 0;

  function updateNavbarScrollState() {
    var st = $(window).scrollTop();
    var scrolled = st > 45;
    var scrollingDown = st > lastScrollTop && st > 100;
    lastScrollTop = Math.max(0, st);

    if (scrolled) {
      $(".nav-bar").addClass("fixed-top");
      if (!mobileMenuIsOpen) {
        $(".nav-bar").addClass("navbar-scrolled");
      }
      
      // Feature: Hide navbar on scroll down (DESKTOP ONLY)
      // On mobile, we always keep logo + hamburger visible with the blur effect
      if ($(window).width() >= 992) {
        if (scrollingDown && !mobileMenuIsOpen) {
          $(".nav-bar").addClass("navbar-hidden");
        } else {
          $(".nav-bar").removeClass("navbar-hidden");
        }
      } else {
        // Mobile: never hide — always remove navbar-hidden
        $(".nav-bar").removeClass("navbar-hidden");
      }

      if ($(window).width() >= 992) {
        $(".nav-bar").css("padding", "0");
      }
    } else {
      $(".nav-bar").removeClass("fixed-top navbar-scrolled navbar-hidden");
      if ($(window).width() >= 992) {
        $(".nav-bar").css("padding", "0px 90px");
      } else {
        $(".nav-bar").css("padding", "0");
      }
    }
  }

  $(window).scroll(updateNavbarScrollState);

  // ── Mobile hamburger: use Bootstrap collapse events for reliable state ──
  $(document).ready(function () {
    var $navCollapse = $('#navbarCollapse');
    if ($navCollapse.length) {
      // Menu is ABOUT TO OPEN
      $navCollapse[0].addEventListener('show.bs.collapse', function () {
        if ($(window).width() < 1025) {
          mobileMenuIsOpen = true;
          document.body.classList.add('mob-menu-open');
          // Remove blur immediately when menu opens
          $(".nav-bar").removeClass("navbar-scrolled");
        }
      });

      // Menu has FULLY CLOSED
      $navCollapse[0].addEventListener('hidden.bs.collapse', function () {
        if ($(window).width() < 1025) {
          mobileMenuIsOpen = false;
          document.body.classList.remove('mob-menu-open');
          // Restore scroll state now that menu is closed
          updateNavbarScrollState();
        }
      });
    }
  });

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Modal Video
  $(document).ready(function () {
    var $videoSrc;
    $(".btn-play").click(function () {
      $videoSrc = $(this).data("src");
    });
    console.log($videoSrc);

    $("#videoModal").on("shown.bs.modal", function (e) {
      $("#video").attr(
        "src",
        $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0",
      );
    });

    $("#videoModal").on("hide.bs.modal", function (e) {
      $("#video").attr("src", $videoSrc);
    });
  });

  // Facts counter
  if ($.fn.counterUp) {
    $('[data-toggle="counter-up"]').counterUp({
      delay: 10,
      time: 2000,
    });
  } else {
    console.warn("counterUp plugin not loaded.");
  }

  // Donation progress
  $(".donation-item .donation-progress").waypoint(
    function () {
      $(".donation-item .progress .progress-bar").each(function () {
        $(this).css("height", $(this).attr("aria-valuenow") + "%");
      });
    },
    { offset: "80%" },
  );

  // Header carousel
  $(".header-carousel").owlCarousel({
    animateOut: "fadeOut",
    animateIn: "fadeIn",
    items: 1,
    autoplay: true,
    smartSpeed: 1000,
    dots: false,
    loop: true,
    nav: true,
    navText: [
      '<i class="bi bi-chevron-left"></i>',
      '<i class="bi bi-chevron-right"></i>',
    ],
  });

  // Testimonials carousel
  $(".testimonial-carousel").owlCarousel({
    items: 1,
    autoplay: true,
    smartSpeed: 1000,
    animateIn: "fadeIn",
    animateOut: "fadeOut",
    dots: false,
    loop: true,
    nav: true,
    navText: [
      '<i class="bi bi-chevron-left"></i>',
      '<i class="bi bi-chevron-right"></i>',
    ],
  });
})(jQuery);
