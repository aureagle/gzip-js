(function () {
	'use strict';

	var crc32 = require('crc32'),
		deflate = require('deflate-js'),
		out = [],
		compressionMethods = {
			'deflate': 8
		},
		flagMap = {
			'origName': 0x08
		},
		osMap = {
			'fat': 0, // FAT file system (DOS, OS/2, NT) + PKZIPW 2.50 VFAT, NTFS
			'amiga': 1, // Amiga
			'vmz': 2, // VMS (VAX or Alpha AXP)
			'unix': 3, // Unix
			'vm/cms': 4, // VM/CMS
			'atari': 5, // Atari
			'hpfs': 6, // HPFS file system (OS/2, NT 3.x)
			'macintosh': 7, // Macintosh
			'z-system': 8, // Z-System
			'cplm': 9, // CP/M
			'tops-20': 10, // TOPS-20
			'ntfs': 11, // NTFS file system (NT)
			'qdos': 12, // SMS/QDOS
			'acorn': 13, // Acorn RISC OS
			'vfat': 14, // VFAT file system (Win95, NT)
			'vms': 15, // MVS (code also taken for PRIMOS)
			'beos': 16, // BeOS (BeBox or PowerMac)
			'tandem': 17, // Tandem/NSK
			'theos': 18 // THEOS
		},
		os = 'unix';

	function putByte(n) {
		out.push(n & 0xFF);
	}

	// LSB first
	function putShort(n) {
		out.push(n & 0xFF);
		out.push(n >>> 8);
	}

	// LSB first
	function putLong(n) {
		putShort(n & 0xffff);
		putShort(n >>> 16);
	}

	function putString(s) {
		var i, len = s.length;
		for (i = 0; i < len; i += 1) {
			putByte(s.charCodeAt(i));
		}
	}

	/*
	 * ZIPs a file in GZIP format. The format is as given by the spec, found at:
	 * http://www.gzip.org/zlib/rfc-gzip.html
	 *
	 * Omitted parts in this implementation:
	 */
	function zip(data, options) {
		var flags = 0,
			level = options.level || 6,
			crc;

		// magic number marking this file as GZIP
		putByte(0x1F);
		putByte(0x8B);

		putByte(compressionMethods['deflate']);

		if (options.name) {
			flags |= flagMap.origName;
		}

		putByte(flags);
		putLong(options.timestamp || parseInt(Date.now() / 1000, 10));

		// put deflate args (extra flags)
		if (level === 1) {
			// fastest algorithm
			putByte(4);
		} else if (level === 9) {
			// maximum compression (fastest algorithm)
			putByte(2);
		} else {
			putByte(0);
		}

		// OS identifier
		putByte(osMap[os]);

		if (options.name) {
			// ignore the directory part
			putString(options.name.substring(options.name.lastIndexOf('/') + 1));

			// terminating null
			putByte(0);
		}

		putString(deflate.deflate(data, level));

		putLong(parseInt(crc32(data), 16));
		putLong(data.length);

		return out;
	}

	module.exports.zip = zip;
}());