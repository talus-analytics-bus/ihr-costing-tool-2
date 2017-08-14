// All code for the home page should go here

(() => {
    App.initHome = () => {
        //$('.enter-site').attr("hfref", "/overview");
        $('.enter-site').click(()=>{hasher.setHash(`overview/`);});
    }
})();