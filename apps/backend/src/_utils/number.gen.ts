export function generatePassword({ length = 8 }) {
    var text = "";
    var possible = "0123456789";
    for (var i = 0; i < length; i++) {
      var sup = Math.floor((Math.random() * 10) % 10);
      text += sup.toString() ;
    }
    return text;
  }

  

  