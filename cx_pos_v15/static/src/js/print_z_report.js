function printZReport() {
    let perDate = document.getElementsByName("z_report_per_date")[0].outerText;
    let perNumber = document.getElementsByName("z_report_per_number")[0].outerText;
    let startDate = document.getElementsByName("z_report_start_date")[0].outerText;
    let endDate = document.getElementsByName("z_report_end_date")[0].outerText;
    let startNumber = document.getElementsByName("z_report_start_number")[0].outerText;
    let endNumber = document.getElementsByName("z_report_end_number")[0].outerText;
    let mode = document.getElementsByName("z_report_mode")[0].outerText;
     
    startDate = startDate.replace(/\//g,'-').split('-').reverse().join('-');
    endDate = endDate.replace(/\//g,'-').split('-').reverse().join('-');
    
    if(perDate==="Si"){
        perDate = true;
    } else{
        perDate = false;}

    
    if(perNumber==="Si"){
        perNumber = true;
    } else{
        perNumber = false;}
    
    if(!mode){
        mode = 'S';
    }

    const z_report_options = {
        perDate,
        perNumber, 
        startDate,
        endDate, 
        startNumber, 
        endNumber, 
        mode,
    };

    const options = {
        method:'POST',
        headers:{
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(z_report_options),
    };

    const url = 'http://localhost:12376/orders/print_Z_report/';

    fetch(url, options)
              .then(data => {
                  if (!data.ok) {
                    throw Error(data.status);
                  }
          
                  return data.json();

                    }).then(z_report_options => {
                        let response = JSON.parse(z_report_options);
                        let message = response['Printer status'].split(',')[2].trim().replace(/[)]/g,'').replace(/["']/g,'')

                        if (message === 'Sin error'){
                            alert(`Printer status: ${response['Printer status']}\nZ Report Printed!`);

                        }else{
                            alert(`Printer status: ${response['Printer status']}`);
                        }

                    }).catch(e => {
                      console.log(e);
                    });
}




