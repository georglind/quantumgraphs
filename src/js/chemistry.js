"use strict";

// QG namespace
var QG = QG || {};
QG.Chemistry = QG.Chemistry|| {};

// Atoms in different configurations
// Atom: {configuration: [free valence, pi-system onsite energy, number of electrons donated]}
// Bond: Atom (bondtype) Atom (conf)

QG.Chemistry.subscripts = ['', '', '₂', '₃', '₄'];

QG.Chemistry.Atoms = {
	'C': {'vars': [['H₄', 0, NaN, 0], ['H₃', 0, NaN, 1], ['H₂', 2, 0, 1], ['H', 3, 0, 1]]},
	'N': {'vars': [['H₃', 0, NaN, 0], ['H:', 1, 0.51, 1], ['::', 1, 0, 1]]},
	'S': {'vars': [['H₂', 0, NaN, 0], ['H:', 1, 1.11, 2], ['::', 1, 0.46, 1]]},
	'O': {'vars': [['H₂', 0, NaN, 0], ['H:', 1, 2.09, 2], ['::', 1, 0.97, 1]]},
}

QG.Chemistry.Bonds = {
	'C-C': 1,
	'C=C': 1.04, // unverified ?
	'C-OH:-C': 0.66,
	'N-OH:': 0.89,
	'OH:=NH:': 0.80,
	'OH:-SH:': 0.54,
	'OH:=S::': 0.43,
	'C=O::': 1.06,
	'C=S::': 0.81,
	'C-SH:': 0.69,
	'C=N': 1.02,
	'C-N-C': 0.89
}
