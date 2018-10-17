
var LunrIndex = lunr.Index.load(MBSearchIndex);
var markInstance = null;
var prevMarkedWords = [];

function mb_toggle_sidebar(event) {
    event.stopPropagation();
    var sidebar = document.getElementById('mb-sidebar-id');
    if (sidebar.classList.contains('mb-show')) {
        sidebar.classList.remove('mb-show');
        document.removeEventListener("click", mb_close_sidebar);
    } else {
        sidebar.classList.add('mb-show');
        document.addEventListener("click", mb_close_sidebar);

    }
}

function mb_close_sidebar() {
    var sidebar = document.getElementById('mb-sidebar-id');
    sidebar.classList.remove('mb-show');
    document.removeEventListener("click", mb_close_sidebar);
}

function mb_get_search_results(val) {
  var elems = [];
  var results = mb_get_search_results_helper(val);
  prevMarkedWords.forEach(function(item) { markInstance.unmark(item);});
  prevMarkedWords = [];

  for (var i = 0; i < results.length; i++) {
        let div = document.createElement("DIV");
        div.innerHTML = '<a href="' + results[i].link + '">' + results[i].label + '</a>';
        elems.push(div);

  }
    prevMarkedWords = val.split(' ');
    prevMarkedWords.forEach(function(item) { markInstance.mark(item);});
  return elems;
}

function mb_get_search_results_helper(terms) {
  var results = LunrIndex.search(terms);
  if (results && results.length > 0) {
    var q = '?kw=' + encodeURIComponent(terms);
    let dlist = [];
    for (var i=0; i<results.length; i++) {
      let ref = results[i].ref;
      let temp = ref.split('\n');
      let link = temp[0];
      if (link.indexOf('#') == -1) {
        link = link + q;
      } else {
        link = link.substring(0, link.indexOf('#')) + q + link.substring(link.indexOf('#'), link.length);
      }
      dlist.push({link: MBRootDir + link, label: temp[1]});
    }
    console.log(JSON.stringify(dlist));
    return dlist;
  }
  return [];
}

function mb_enable_search(inp) {
    inp.addEventListener("input", function (e) {
        var div, i, val = this.value;
        mb_clear_search_dropdown();
        if (!val) { return false; }

        div = document.createElement("DIV");
        div.setAttribute("class", "mb-search-results");
        this.parentNode.appendChild(div);
        var searchResults = mb_get_search_results(val);
        for (var i=0; i<searchResults.length; i++) div.appendChild(searchResults[i]);
    });
    
    function mb_clear_search_dropdown() {
        var sr = document.getElementsByClassName("mb-search-results");
        for (var i = 0; i < sr.length; i++) {
          sr[i].parentNode.removeChild(sr[i]);
        }
    }
    document.addEventListener("click", function (e) {
        mb_clear_search_dropdown();
    });

}

function mb_get_parameter_by_name(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[#?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function mb_init_search() {
  mb_enable_search(document.getElementById("search-input"));
  markInstance = new Mark(document.querySelector(".mb-content"));
  let kw = mb_get_parameter_by_name('kw');
  if (kw) {
    kw = kw.split(' ');
    kw.forEach(function(element) {
      markInstance.mark(element);
    });
  }
  
}

