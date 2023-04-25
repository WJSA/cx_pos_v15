//close cashier
function closeCashier() {
    const url = 'http://localhost:12376/orders/cashier_close/';

    const options = {
        method:'GET'
    };

    fetch(url, options)
              .then(data => {
                  if (!data.ok) {
                    throw Error(data.status);
                  }
                   
          
                  return data.json();

                    }).then(data => {
                      let response = JSON.parse(data);
                      let message = response['Printer status'].split(',')[2].trim().replace(/[)]/g,'').replace(/["']/g,'')

                      if (message === 'Sin error'){
                          alert(`Printer status: ${response['Printer status']}\nCashier is closed!`);

                      }else{
                          alert(`Printer status: ${response['Printer status']}`);
                      }

                    }).catch(e => {
                      console.log(e);
                    });

}