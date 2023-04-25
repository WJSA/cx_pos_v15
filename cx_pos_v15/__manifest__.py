# -*- coding: utf-8 -*-
{
    'name': "Customizations POS",
    'description': """

    Customizations for Point of Sale, print receipts using api.

    Colaborador: Jesús David Briceño
    """,
    'author': "ESTELIO",
    'category': 'Point of Sale',
    'version': '15.0.1',
    'depends': ['point_of_sale', 'hr'],
    'data': [
        'security/ir.model.access.csv',
        'views/account_tax.xml',
        'views/pos_session.xml',
        'views/payment_methods.xml',
        'views/cashier.xml',
        'views/return.xml',
        'views/header_footer.xml',
        'views/pos_order.xml',
        'wizard/cx_pos_payments_report_wizard.xml',
        'report/cx_pos_payments_report.xml',
        'views/templates.xml',
        'data/payments_report_email_template.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'cx_pos_v15/static/src/js/pos_print.js',
            'cx_pos_v15/static/src/js/pos_commentary.js',
            'cx_pos_v15/static/src/js/payment_screen.js',
            'cx_pos_v15/static/src/js/product_screen.js',
            'cx_pos_v15/static/src/js/close_popup.js',
            'cx_pos_v15/static/src/js/pos.js',
            'cx_pos_v15/static/src/css/cx_pos.css',
        ],
        'web.assets_qweb': [
            'cx_pos_v15/static/src/js/pos_product_screen.js',
        ],
    },
    'installable': True,
}
