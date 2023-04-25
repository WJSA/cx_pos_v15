function registerHeaderAndFooter(){
    let header = document.getElementsByName("header")[0].outerText;
    let footer = document.getElementsByName("footer")[0].outerText;

    header = header.split('\n');
    footer = footer.split('\n');

    const header_footer = {
        footer,
        header
    }

    const options = {
        method: 'POST',
        headers: {
        //   'Access-Control-Allow-Origin': '*',
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(header_footer),
      };
  
    const url = 'http://localhost:12376/orders/set_headerfooter/';

    fetch(url, options)
              .then(data => {
                  if (!data.ok) {
                    throw Error(data.status);
                  }
          
                  return data.json();
          
                    }).then(header_footer => {
                      let response = JSON.parse(header_footer);
                      let message = response['Printer status'].split(',')[2].trim().replace(/[)]/g,'').replace(/["']/g,'')

                      if (message === 'Sin error'){
                          alert(`Printer status: ${response['Printer status']}\nHeader and Footer registered!`);

                      }else{
                          alert(`Printer status: ${response['Printer status']}`);
                      }
                      
                    }).catch(e => {
                      console.log(e);
                    });
}