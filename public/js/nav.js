  
  var navButton = document.getElementById("nav-button");
  var navElement = document.getElementById("drawer");


  

  navButton.addEventListener("click",navClicked,false);



  navElement.addEventListener("animationstart", listener, false);
  navElement.addEventListener("animationend", listener, false);
  navElement.addEventListener("animationiteration", listener, false);


  function navClicked(event) {
    navElement.style["animation-play-state"] = "running";
    
    if(!navElement.classList.contains("slide-in")){
      navElement.classList.add("slide-in");
    }

    if(!navElement.classList.contains("open")){
      navElement.classList.add("open");
      //resize the three.js canvas
      widthDivider = 2.0;
      heightDivider = 0.5;
      window.dispatchEvent(new Event('resize'));
    }else{
      navElement.classList.remove("open");
      //resize the three.js canvas
      heightDivider = 1.0;
      widthDivider = 1.0; 
      window.dispatchEvent(new Event('resize'));
    }
  }


  function listener(event) {
    var l = document.createElement("li");
    switch(event.type) {
      case "animationstart":
        
        break;
      case "animationend":
          
        break;
      case "animationiteration":
          navElement.style["animation-play-state"] = "paused";
        break;
    }
    
  }
