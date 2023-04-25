//Register Payment method function
function registerCashier() {
    let ID = document.getElementsByName("register_id")[0].outerText;
    let code = document.getElementsByName("cashier_code")[0].outerText;
    let descriptor = document.getElementsByName("cashier_id")[0].outerText;

    ID = Number(ID.replace('.',''));
    code = Number(code.replace('.',''));

    const register_cashier = {
        ID,
        code,
        descriptor
    };

    const options = {
        method:'POST',
        headers:{
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(register_cashier),
    };

    const url = 'http://localhost:12376/orders/cashier_register/';

    fetch(url, options)
              .then(data => {
                  if (!data.ok) {
                    throw Error(data.status);
                  }
           
                  return data.json();

                    }).then(register_cashier => {
                        let response = JSON.parse(register_cashier);
                        let message = response['Printer status'].split(',')[2].trim().replace(/[)]/g,'').replace(/["']/g,'')

                        if (message === 'Sin error'){
                            alert(`Printer status: ${response['Printer status']}\n${descriptor} is registered as cashier!`);

                        }else{
                            alert(`Printer status: ${response['Printer status']}`);
                        }

                    }).catch(e => {
                      console.log(e);
                    });
}