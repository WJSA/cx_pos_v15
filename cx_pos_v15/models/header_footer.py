# -*- coding: utf-8 -*-

from odoo import api, fields, models
from odoo.exceptions import UserError

class HeaderFooter(models.Model):
    _name = 'pos.header.footer'
    _description = 'Header and footer for register in fiscal printer'

    def _compute_name(self):
        for rec in self:
            rec.name = "Mensaje {number}".format(number=rec.id)

    name = fields.Char(string='Descriptor', compute='_compute_name', readonly=True)
    header = fields.Text(string='Header', require=True)
    footer = fields.Text(string='Footer', require=True)