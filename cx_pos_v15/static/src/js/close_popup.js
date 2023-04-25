odoo.define('cx_close_popup', function (require) {
  "use strict";

  const ClosePosPopup = require('point_of_sale.ClosePosPopup');
  const Registries = require('point_of_sale.Registries');
  const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');

  class ConfirmPopupIGTF extends AbstractAwaitablePopup {}
    ConfirmPopupIGTF.template = 'ConfirmPopupIGTF';
    ConfirmPopupIGTF.defaultProps = {
        confirmText: 'Aceptar',
        title: 'Cierre con IGTF',
        body: 'Se ha encontrado una diferencia ocasionada por los montos asociados al IGTF, por lo que usted debe cerrar manualmente la sesión desde el backend.',
    };

  Registries.Component.add(ConfirmPopupIGTF);

  const ClosePosPopupIGTF = ClosePosPopup =>
    class extends ClosePosPopup {
      async handleClosingError(response) {
        await this.showPopup('ConfirmPopupIGTF');
        if (response.redirect) {
            window.location = '/web#action=point_of_sale.action_client_pos_menu';
        }
      }
    };
  Registries.Component.extend(ClosePosPopup, ClosePosPopupIGTF);

  return ConfirmPopupIGTF;
});