﻿class ImagesBio {
	constructor() {
		this.artist = '';
		this.blur = null;
		this.counter = 0;
		this.cur = null;
		this.cur_artist = '';
		this.cur_handle = null;
		this.get = true;
		this.init = true;
		this.nh = 10;
		this.nw = 10;
		this.removed = 0;
		this.x = 0;
		this.y = 0;
		this.exclArr = [6467, 6473, 6500, 24104, 24121, 34738, 35875, 37235, 47700, 68626, 86884, 92172];
		this.ext = ['.jpg', '.png', '.gif', '.bmp', '.jpeg'];

		this.art = {
			allFilesLength: 0,
			checkArr: [],
			checkNo: 0,
			displayedOtherPanel: null,
			done: false,
			folder: '',
			folderSup: '',
			images: [],
			ix: 0,
			list: [],
			validate: []
		}

		this.cov = {
			counter: 0,
			cycle: pptBio.loadCovAllFb || pptBio.loadCovFolder,
			cycle_ix: 0,
			done: '',
			folder: '',
			folderSameAsArt: cfg.albCovFolder.toUpperCase() == cfg.pth.foImgArt.toUpperCase(),
			ix: 0,
			images: [],
			list: [],
			newBlur: false,
			blur: null,
			selection: $Bio.jsonParse(pptBio.loadCovSelFb, [0, 1, 2, 3, 4])
		}

		this.blackList = {
			file: `${fb.ProfilePath}yttm\\blacklist_image.json`,
			artist: '',
			cur: '',
			item: [],
			undo: []
		}

		this.bor = {
			w1: 0,
			w2: 0
		}

		this.filter = {
			maxSz: 12582912,
			minSz: 51200,
			minPx: 500,
			minNo: 3,
			size: false
		}

		this.id = {
			albCounter: '',
			curAlbCounter: '',
			albCyc: '',
			curAlbCyc: '',
			album: '',
			curAlbum: '',
			artCounter: '',
			curArtCounter: '',
			blur: '',
			curBlur: '',
			img: '',
			curImg: '',
			w1: 0,
			w2: 0
		}

		this.im = {
			t: 0,
			r: 0,
			b: 0,
			l: 0,
			w: 100,
			h: 100
		}

		this.mask = {
			circular: null,
			fade: null,
			reflection: null,
			reset: false
		}

		pptBio.reflStrength = $Bio.clamp(pptBio.reflStrength, 0, 100);
		pptBio.reflGradient = $Bio.clamp(pptBio.reflGradient, 0, 100);
		pptBio.reflSize = $Bio.clamp(pptBio.reflSize, 0, 100);

		this.refl = {
			adjust: false,
			gradient: pptBio.overlayGradient / 10 - 1,
			size: $Bio.clamp(pptBio.reflSize / 100, 0.1, 1),
			strength: $Bio.clamp(255 * pptBio.reflStrength / 100, 0, 255)
		}

		this.stub = {
			art: {
				file: `${fb.ProfilePath}yttm\\artist_stub_user.png`,
				folder: `${fb.ProfilePath}yttm\\artist_stub_user`,
				path: '',
				user: null
			},
			cov: {
				file: `${fb.ProfilePath}yttm\\front_cover_stub_user.png`,
				folder: `${fb.ProfilePath}yttm\\front_cover_stub_user`,
				path: '',
				user: null
			},
			default: []
		}

		this.style = {
			alpha: 255,
			blur: null,
			circular: false,
			crop: false,
			border: 0,
			delay: Math.min(pptBio.cycTimePic, 7) * 1000,
			fade: false,
			horizontal: true,
			overlay: false,
			reflection: false,
			vertical: false
		}

		this.timeStamp = {
			cov: Date.now(),
			photo: Date.now()
		}

		this.touch = {
			dn: false,
			end: 0,
			start: 0
		}

		this.transition = {
			level: $Bio.clamp(100 - pptBio.transLevel, 0.1, 100)
		}

		this.transition.incr = Math.pow(284.2171 / this.transition.level, 0.0625);
		if (this.transition.level == 100) this.transition.level = 255;

		this.cycImages = this.cov.folderSameAsArt ? this.artImages : v => {
			if (!$Bio.file(v)) return false;
			return /(?:jpe?g|gif|png|bmp)$/i.test(fso.GetExtensionName(v));
		}

		this.ext.some(v => {
			this.stub.art.path = this.stub.art.folder + v;
			if ($Bio.file(this.stub.art.path)) {
				this.stub.art.user = gdi.Image(this.stub.art.path);
				return true;
			}
		});

		this.ext.some(v => {
			this.stub.cov.path = this.stub.cov.folder + v;
			if ($Bio.file(this.stub.cov.path)) {
				this.stub.cov.user = gdi.Image(this.stub.cov.path);
				return true;
			}
		});

		this.setCov = $Bio.debounce(() => {
			filmStrip.logScrollPos();
			if (this.cov.ix < 0) this.cov.ix = this.cov.images.length - 1;
			else if (this.cov.ix >= this.cov.images.length) this.cov.ix = 0;
			this.cov.cycle_ix = this.cov.ix;
			const key = this.cov.images[this.cov.ix];
			this.loadImg(cov, key, true, this.cov.ix, this.isEmbedded('stnd', this.cov.ix));
			this.timeStamp.cov = Date.now();
		}, 100);

		this.setPhoto = $Bio.debounce(() => {
			filmStrip.logScrollPos();
			if (this.art.ix < 0) this.art.ix = this.art.images.length - 1;
			else if (this.art.ix >= this.art.images.length) this.art.ix = 0;
			this.loadArtImage();
			this.timeStamp.photo = Date.now();
		}, 100);

		this.createImages();
		if (pptBio.img_only) this.setCrop(true);
		this.processSizeFilter();

		this.cov.selFiltered = this.cov.selection.filter(v => v != -1);
	}

	// Methods

	artImages(v) {
		if (!$Bio.file(v)) return false;
		const fileSize = utils.GetFileSize(v);
		return (name.isLfmImg(fso.GetFileName(v)) || !pptBio.imgFilterLfm && /(?:jpe?g|gif|png|bmp)$/i.test(fso.GetExtensionName(v)) && !/ - /.test(fso.GetBaseName(v))) && !this.exclArr.includes(fileSize) && !this.blackListed(v);
	}

	artistReset(force) {
		if (panelBio.lock) return;
		this.blurCheck();
		this.cur_artist = this.artist;
		this.artist = name.artist(pptBio.focus);
		const new_artist = this.artist && this.artist != this.cur_artist || !this.artist || pptBio.covBlur && uiBio.style.isBlur && this.id.blur != this.id.curBlur || force;
		if (new_artist) {
			this.art.folderSup = '';
			this.art.folder = panelBio.cleanPth(cfg.pth.foImgArt, pptBio.focus);
			this.clearArtCache(true);
			if (pptBio.cycPhoto) this.art.done = false;
			if (!this.art.images.length) {
				this.art.allFilesLength = 0;
				this.art.ix = 0;
			}
		}
	}

	blacklist(clean_artist) {
		let black_list = [];
		if (!$Bio.file(this.blackList.file)) return black_list;
		const list = $Bio.jsonParse(this.blackList.file, false, 'file');
		return list.blacklist[clean_artist] || black_list;
	}

	blackListed(v) {
		imgBio.blackList.cur = this.blackList.artist;
		this.blackList.artist = this.artist || name.artist(pptBio.focus);
		if (this.blackList.artist && this.blackList.artist != imgBio.blackList.cur) {
			imgBio.blackList.item = this.blacklist($Bio.clean(this.blackList.artist).toLowerCase());
		}
		return imgBio.blackList.item.includes(v.slice(v.lastIndexOf('_') + 1));
	}

	blurCheck() {
		if (!(pptBio.covBlur && uiBio.style.isBlur) && !pptBio.imgSmoothTrans) return;
		this.id.curBlur = this.id.blur;
		this.id.blur = name.albID(pptBio.focus, 'stnd');
		this.id.blur += pptBio.covType;
		if (this.id.blur != this.id.curBlur) {
			this.cov.newBlur = true;
			txt.rev.lookUp = false;
		}
	}

	blurImage(image, o) {
		if (!image || !panelBio.w || !panelBio.h) return;
		if (this.covBlur() && this.cov.newBlur) {
			let handle = null;
			this.cov.blur = null;
			if (cfg.cusCov && !pptBio.covType) {
				this.chkPths(cfg.cusCovPaths, '', 1, true);
			}
			if (!this.cov.blur) {
				handle = $Bio.handle(pptBio.focus);
				if (handle) this.cov.blur = utils.GetAlbumArtV2(handle, pptBio.covType, !pptBio.covType ? false : true);
			}
			if (!this.cov.blur && !pptBio.covType) {
				const pth_cov = panelBio.getPth('cov', pptBio.focus).pth;
				this.ext.some(v => {
					if ($Bio.file(pth_cov + v)) {
						this.cov.blur = gdi.Image(pth_cov + v);
						return true;
					}
				});
			}
			if (!this.cov.blur && !pptBio.covType) {
				const a = name.albumArtist(pptBio.focus);
				const l = name.album(pptBio.focus);
				const pth_cov = [panelBio.getPth('cov', pptBio.focus).pth, panelBio.getPth('img', pptBio.focus, a, l).pth];
				this.chkPths(pth_cov, '', 1);
			}
			if (!this.cov.blur && !pptBio.covType)
				if (handle) this.cov.blur = utils.GetAlbumArtV2(handle, 0);
			if (!this.cov.blur) this.cov.blur = this.stub.default[0].Clone(0, 0, this.stub.default[0].Width, this.stub.default[0].Height);
			this.cov.newBlur = false;
			if (this.cov.blur && !pptBio.blurAutofill) this.cov.blur = this.cov.blur.Resize(panelBio.w, panelBio.h);
		}
		if (this.covBlur() && this.cov.blur) image = this.cov.blur;
		image = pptBio.blurAutofill ? this.format(image, 1, 'crop', panelBio.w, panelBio.h, 'blurAutofill', o) : this.format(image, 1, 'stretch', panelBio.w, panelBio.h, 'blurStretch', o);
		const i = $Bio.gr(panelBio.w, panelBio.h + scaleForDisplay(30), true, (g, gi) => {
			g.SetInterpolationMode(0);
			if (uiBio.blur.blend) {
				const iSmall = image.Resize(Math.max(panelBio.w * uiBio.blur.level / 100, 1), Math.max(panelBio.h * uiBio.blur.level / 100, 2, 1), 2);
				const iFull = iSmall.Resize(panelBio.w, panelBio.h, 2);
				const offset = 90 - uiBio.blur.level;
				g.DrawImage(iFull, uiBio.x - offset, uiBio.y - scaleForDisplay(70), panelBio.w + offset * 2, panelBio.h + offset * 2 + scaleForDisplay(30), 0, 0, iFull.Width, iFull.Height, 0, uiBio.blur.blendAlpha);
			} else {
				g.DrawImage(image, uiBio.x - pptBio.borL, uiBio.y - scaleForDisplay(70), panelBio.w, panelBio.h + scaleForDisplay(30), 0, 0, image.Width, image.Height);
				if (uiBio.blur.level > 1) gi.StackBlur(uiBio.blur.level);
				g.FillSolidRect(uiBio.x - pptBio.borL, uiBio.y - scaleForDisplay(70), panelBio.w, panelBio.h + scaleForDisplay(30), this.isImageDark(gi) ? uiBio.col.bg_light : uiBio.col.bg_dark);
			}
		});
		return i;
	}

	cache() {
		return pptBio.artistView ? art : cov;
	}

	changeCov(incr) {
		filmStrip.logScrollPos();
		this.cov.cycle_ix += incr;
		if (this.cov.cycle_ix < 0) this.cov.cycle_ix = this.cov.images.length - 1;
		else if (this.cov.cycle_ix >= this.cov.images.length) this.cov.cycle_ix = 0;
		this.cov.ix = this.cov.cycle_ix;
		const key = this.cov.images[this.cov.ix];
		this.loadImg(cov, key, true, this.cov.ix, this.isEmbedded('stnd', this.cov.ix));
	}

	changePhoto(incr) {
		filmStrip.logScrollPos();
		this.art.ix += incr;
		if (this.art.ix < 0) this.art.ix = this.art.images.length - 1;
		else if (this.art.ix >= this.art.images.length) this.art.ix = 0;
		let i = 0;
		while (this.art.displayedOtherPanel == this.art.images[this.art.ix] && i < this.art.images.length) {
			this.art.ix += incr;
			if (this.art.ix < 0) this.art.ix = this.art.images.length - 1;
			else if (this.art.ix >= this.art.images.length) this.art.ix = 0;
			i++;
		}
		this.setCheckArr(this.art.images[this.art.ix]);
		this.loadArtImage();
	}

	check() {
		filmStrip.logScrollPos();
		this.id.albCyc = '';
		this.id.curAlbCyc = '';
		this.clearArtCache(true);
		if (panelBio.stndItem()) {
			this.art.done = false;
			if (!this.art.images.length) {
				this.art.allFilesLength = 0;
				this.art.ix = 0;
			}
			if (pptBio.artistView && pptBio.cycPhoto) this.getArtImg();
			else this.getFbImg();
		} else this.getItem(panelBio.art.ix, panelBio.alb.ix, true);
	}

	checkArr(info) {
		if (panelBio.block()) return;
		if (this.art.images.length < 2 || !pptBio.artistView || pptBio.text_only || !pptBio.cycPhoto) return;
		if (!this.art.validate.includes(info[0])) this.art.validate.push(info[0]);
		this.art.displayedOtherPanel = info[1];
		if (!this.id.w1) this.id.w1 = info[0];
		this.id.w2 = (this.id.w1 == info[0]) ? 0 : info[0];
		if (this.art.images[this.art.ix] != info[2] && !this.id.w2 && this.art.checkNo < 10) {
			this.art.checkNo++;
			this.art.checkArr = [window.ID, this.art.images[this.art.ix], this.art.displayedOtherPanel];
			window.NotifyOthers('bio_checkImgArr', this.art.checkArr);
		}
		if (window.ID > info[0]) return;
		if (this.art.images[this.art.ix] == this.art.displayedOtherPanel && this.art.validate.length < 2) this.changePhoto(1);
	}

	checkUserStub(type, handle) {
		switch (type) {
			case 'art': {
				if (this.stub.art.user) break;
				const stubArtUser = utils.GetAlbumArtV2(handle, 4);
				if (stubArtUser) stubArtUser.SaveAs(this.stub.art.file);
				if ($Bio.file(this.stub.art.file)) {
					this.stub.art.user = gdi.Image(this.stub.art.file);
					this.stub.art.path = this.stub.art.file;
				}
				break;
			}
			case 'cov': {
				if (this.stub.cov.user) break;
				const stubCovUser = utils.GetAlbumArtV2(handle, 0);
				if (stubCovUser) stubCovUser.SaveAs(this.stub.cov.file);
				if ($Bio.file(this.stub.cov.file)) {
					this.stub.cov.user = gdi.Image(this.stub.cov.file);
					this.stub.cov.path = this.stub.cov.file;
				}
				break;
			}
		}
	}

	chkPths(pths, fn, type, cusCovPaths) {
		let h = false;
		pths.some(v => {
			if (h) return true;
			const ph = !cusCovPaths ? v + fn : $Bio.eval(v + fn, pptBio.focus);
			this.ext.some(w => {
				const ep = ph + w;
				if ($Bio.file(ep)) {
					h = true;
					switch (type) {
						case 0:
							this.loadImg(cov, ep, true, this.cov.ix);
							return true;
						case 1:
							this.cov.blur = gdi.Image(ep);
							return true;
						case 2:
							return true;
						case 3:
							h = ep;
							return true;
					}
				}
			});
		});
		return h;
	}

	circularMask(image, tw, th) {
		image.ApplyMask(this.mask.circular.Resize(tw, th));
	}

	clearArtCache(fullClear) {
		if (fullClear) {
			this.art.images = [];
			this.art.validate = [];
			this.art.checkNo = 0;
		}
		art.cache = {};
	}

	clearCovCache() {
		cov.cache = {};
	}

	clearCache() {
		this.clearCovCache();
		this.clearArtCache();
	}

	covBlur() {
		return pptBio.covBlur && uiBio.style.isBlur && (pptBio.artistView || this.cov.cycle || pptBio.text_only || panelBio.alb.ix);
	}

	createImages() {
		const bg = this.isType('AnyBor') || !uiBio.blur.dark && !uiBio.blur.light;
		const cc = StringFormat(1, 1);
		const font1 = gdi.Font('Segoe UI', 184, 1);
		const font2 = gdi.Font('Segoe UI', 80, 1);
		const font3 = gdi.Font('Segoe UI', 200, 1);
		const font4 = gdi.Font('Segoe UI', 90, 1);
		const tcol = !bg ? uiBio.col.text : uiBio.dui ? window.GetColourDUI(0) : uiBio.col.noPhotoStubText;
		const sz = 600;
		for (let i = 0; i < 3; i++) {
			this.stub.default[i] = $Bio.gr(sz, sz, true, g => {
				g.SetSmoothingMode(2);
				if (bg) {
					g.FillSolidRect(0, 0, sz, sz, tcol);
					g.FillSolidRect(-1, 0, sz + 5, sz, uiBio.col.noPhotoStubBg);
				}
				g.SetTextRenderingHint(3);
				g.DrawString('NO', i == 2 ? font3 : font1, tcol, 0, 0, sz, sz * 275 / 500, cc);
				g.DrawString(['COVER', 'PHOTO', 'SELECTION'][i], i == 2 ? font4 : font2, tcol, 0, sz * 108 / 500, sz, sz * 275 / 500, cc);
				g.FillSolidRect((sz - 380) / 2, sz * 400 / 500, 380, 20, tcol & 0x15ffffff);
			});
			this.mask.circular = $Bio.gr(500, 500, true, g => {
				g.FillSolidRect(0, 0, 500, 500, RGB(255, 255, 255));
				g.SetSmoothingMode(2);
				g.FillEllipse(1, 1, 498, 498, RGBA(0, 0, 0, 255));
			});
		}
		this.get = true;
	}

	cur_pth() {
		return this.cache().pth;
	}

	draw(gr) {
		if (pptBio.text_only && !uiBio.style.isBlur) return;
		if (uiBio.style.isBlur && this.blur) gr.DrawImage(this.blur, uiBio.x - pptBio.borL, uiBio.y - scaleForDisplay(30), this.blur.Width, this.blur.Height, 0, 0, this.blur.Width, this.blur.Height);
		if (this.get) return this.getImgFallback();
		if (!pptBio.text_only && this.cur) gr.DrawImage(this.cur, this.x, pptBio.img_only ? pptBio.artStyleImgOnly !== 1 && pptBio.covStyleImgOnly !== 1 || pptBio.covStyleImgOnly !== 1 && pptBio.artStyleImgOnly !== 1 ? this.y + scaleForDisplay(5) : this.y + scaleForDisplay(40) : this.y, this.cur.Width, pptBio.img_only ? this.cur.Height + scaleForDisplay(30) : this.cur.Height, 0, 0, this.cur.Width, this.cur.Height, 0, this.style.alpha);
	}

	fadeMask(image, x, y, w, h) {
		const xl = Math.max(0, panelBio.tbox.l - x);
		let f = Math.min(w, panelBio.tbox.l - x + panelBio.tbox.w);
		this.refl.adjust = false;
		if (xl >= f) return image;
		const wl = f - xl;
		const yl = Math.max(0, panelBio.tbox.t - y);
		f = Math.min(h, panelBio.tbox.t - y + panelBio.tbox.h);
		if (yl >= f) return image;
		const hl = f - yl;
		if (!this.mask.fade || this.mask.reset) {
			const km = uiBio.overlay.gradient != -1 && panelBio.img.t <= panelBio.text.t - uiBio.heading.h ? uiBio.overlay.strength / 500 + uiBio.overlay.gradient / 10 : 0;
			this.mask.fade = $Bio.gr(500, 500, true, g => {
				for (let k = 0; k < 500; k++) {
					const c = 255 - $Bio.clamp(uiBio.overlay.strength - k * km, 0, 255);
					g.FillSolidRect(0, k, 500, 1, RGB(c, c, c));
				}
			});
			this.mask.reset = false;
		}
		const mask = $Bio.gr(w, h, true, g => g.DrawImage(this.mask.fade, xl, yl, wl, hl, 0, 0, this.mask.fade.Width, this.mask.fade.Height));
		image.ApplyMask(mask);
	}

	format(image, n, type, w, h, caller, o, blur, border, fade, reflection) {
		let ix = 0;
		let iy = 0;
		let iw = image.Width;
		let ih = image.Height;
		switch (type) {
			case 'crop':
			case 'circular': {
				const s1 = iw / w;
				const s2 = ih / h;
				const r = s1 / s2;
				if (this.needTrim(n, r)) {
					if (s1 > s2) {
						iw = Math.round(w * s2);
						ix = Math.round((image.Width - iw) / 2);
					} else {
						ih = Math.round(h * s1);
						iy = Math.round((image.Height - ih) / 8);
					}
					image = image.Clone(ix, iy, iw, ih);
				}
				if (caller == 'blurAutofill') return image;
				if (type == 'circular') this.circularMask(image, image.Width, image.Height);
				if (!border) image = image.Resize(w, h, 2);
				if (caller == 'filmStrip') return image;
				break;
			}
			case 'stretch':
				image = image.Resize(w, h, 2);
				if (caller == 'blurStretch') return image;
				break;
			default: {
				const sc = Math.min(h / ih, w / iw);
				this.im.w = Math.round(iw * sc);
				this.im.h = Math.round(ih * sc);
				if (!border) image = image.Resize(this.im.w, this.im.h, 2);
				if (caller != 'img') return image;
				break;
			}
		}

		this.setAlignment();

		if (border) image = this.getBorder(image, this.im.w, this.im.h, this.bor.w1, this.bor.w2);
		if (fade) this.fadeMask(image, this.im.l, this.im.t, image.Width, image.Height);
		o.x = o.counter_x = seeker.counter.x = this.x = this.im.l;
		o.y = o.counter_y = seeker.counter.y = this.y = this.im.t;
		o.w = this.im.w;
		o.h = this.im.h;
		if (reflection) image = this.reflImage(image, this.im.l, this.im.t, image.Width, image.Height, o);
		if (blur) {
			o.blur = this.blurImage(blur, o);
			this.blur = o.blur;
		}
		return image;
	}

	fresh() {
		this.counter++;
		if (this.counter < pptBio.cycTimePic) return;
		this.counter = 0;
		if (panelBio.block() || !pptBio.cycPic || pptBio.text_only || seeker.dn || panelBio.zoom()) return;
		if (pptBio.artistView) {
			if (this.art.images.length < 2 || Date.now() - this.timeStamp.photo < this.style.delay || !pptBio.cycPhoto) return;
			this.changePhoto(1);
		} else if (this.cov.cycle) {
			if (this.cov.images.length < 2 || Date.now() - this.timeStamp.cov < this.style.delay || panelBio.alb.ix) return;
			this.changeCov(1);
		}
	}
	filmOK(newArr) {
		return newArr && this.art.list.length && pptBio.showFilmStrip && filmStrip.scroll.pos.art[this.artist] && filmStrip.scroll.pos.art[this.artist].arr && filmStrip.scroll.pos.art[this.artist].arr.length;
	}
	getArtImages() {
		let allFiles = this.art.folder ? utils.Glob(this.art.folder + '*') : [];
		if (!allFiles.length && this.art.folderSup) allFiles = utils.Glob(this.art.folderSup + '*');
		if (allFiles.length == this.art.allFilesLength) return;
		let newArr = false;
		if (!this.art.images.length) {
			newArr = true;
			art.cache = {};
		}
		this.art.allFilesLength = allFiles.length;
		this.removed = 0;
		this.art.list = allFiles.filter(this.images.bind(this));
		if (this.filmOK(newArr)) {
			if ($Bio.equal(this.art.list, filmStrip.scroll.pos.art[this.artist].images)) {
				this.art.images = filmStrip.scroll.pos.art[this.artist].arr;
				this.art.ix = filmStrip.scroll.pos.art[this.artist].ix || 0;
				return;
			}
		} else filmStrip.logScrollPos(this.art.list);

		let arr = this.art.list.slice();
		if (this.filter.size) arr = arr.filter(this.sizeFilter.bind(this));
		this.art.images = this.art.images.concat(arr);
		if (this.art.images.length > 1) {
			this.art.images = this.uniq(this.art.images);
			if (newArr) this.art.images = $Bio.shuffle(this.art.images);
		}
		if (!newArr) seeker.upd();
		filmStrip.check(newArr);
	}

	getImages(force) {
		if (pptBio.text_only && !uiBio.style.isBlur && !pptBio.showFilmStrip) return;
		if (pptBio.artistView && pptBio.cycPhoto) {
			if (!panelBio.art.ix) this.artistReset(force);
			this.getArtImg();
		} else this.getFbImg();
	}

	getArtImg(update) {
		if (!pptBio.artistView || pptBio.text_only && !uiBio.style.isBlur && !pptBio.showFilmStrip) return;
		if (!this.art.done || update) {
			this.art.done = true;
			if (this.artist) this.getArtImages();
		}
		this.setCheckArr(pptBio.cycPhoto ? this.art.images[this.art.ix] : null);
		this.loadArtImage();
	}

	getBorder(image, w, h, bor_w1, bor_w2) {
		const imgo = 7;
		const dpiCorr = ($Bio.scale - 1) * imgo;
		const imb = imgo - dpiCorr;
		let imgb = 0;
		let sh_img = null;
		if (this.style.border > 1 && !this.style.reflection) {
			imgb = 15 + dpiCorr;
			sh_img = $Bio.gr(Math.floor(w + bor_w2 + imb), Math.floor(h + bor_w2 + imb), true, g => !this.style.circular ? g.FillSolidRect(imgo, imgo, w + bor_w2 - imgb, h + bor_w2 - imgb, RGBA(0, 0, 0, 185)) : g.FillEllipse(imgo, imgo, w + bor_w2 - imgb, h + bor_w2 - imgb, RGBA(0, 0, 0, 185)));
			sh_img.StackBlur(12);
		}
		let bor_img = $Bio.gr(Math.floor(w + bor_w2 + imgb), Math.floor(h + bor_w2 + imgb), true, g => {
			if (this.style.border > 1 && !this.style.reflection) g.DrawImage(sh_img, 0, 0, Math.floor(w + bor_w2 + imgb), Math.floor(h + bor_w2 + imgb), 0, 0, sh_img.Width, sh_img.Height);
			if (this.style.border == 1 || this.style.border == 3) {
				if (!this.style.circular) g.FillSolidRect(0, 0, w + bor_w2, h + bor_w2, RGB(255, 255, 255));
				else {
					g.SetSmoothingMode(2);
					g.FillEllipse(0, 0, w + bor_w2, h + bor_w2, RGB(255, 255, 255));
				}
			}
			g.DrawImage(image, bor_w1, bor_w1, w, h, 0, 0, image.Width, image.Height);
		});
		sh_img = null;
		return bor_img;
	}

	getCallerId(key) {
		const a = art.cache[key];
		const c = cov.cache[key];
		return {
			art_id: a && a.id,
			cov_id: c && c.id
		};
	}

	getCovImages() {
		if (pptBio.artistView || !this.cov.cycle || panelBio.alb.ix) return false;
		if (!panelBio.lock) this.setAlbID();
		const new_album = this.id.albCyc != this.id.curAlbCyc || !this.id.albCyc;
		if (pptBio.loadCovFolder && !panelBio.lock) this.cov.folder = panelBio.cleanPth(cfg.albCovFolder, pptBio.focus);
		if (new_album) {
			this.clearCovCache();
			this.cov.counter = 0;
			this.cov.list = [];
			this.cov.images = [];
			cov_scroller.reset();
			filmStrip.scroll.pos.cov = {};
			this.cov.ix = this.cov.cycle_ix = 0;
			if (pptBio.loadCovFolder) {
				this.cov.images = this.cov.folder ? utils.Glob(this.cov.folder + '*') : [];
				this.removed = 0;
				this.cov.images = this.cov.images.filter(this.cycImages.bind(this));
				if (this.cov.folderSameAsArt) {
					if (this.filter.size) this.cov.images = this.cov.images.filter(this.sizeFilter.bind(this));
					this.cov.images = $Bio.shuffle(this.cov.images);
				}
				for (let i = 0; i < this.cov.images.length; i++) {
					this.cov.list[i + 10] = {}
					this.cov.list[i + 10].id = i + 10;
					this.cov.list[i + 10].pth = this.cov.images[i];
				}
				this.cov.list = this.cov.list.filter(Boolean);
				this.cov.images = this.cov.list.map(v => v.pth);
				filmStrip.check();
			}
			if (pptBio.loadCovAllFb) {
				const handle = $Bio.handle(pptBio.focus);
				if (handle) imgBio.cov.selFiltered.forEach(v => this.getImg(handle, v, false));
				else if (!pptBio.loadCovFolder || !this.cov.images.length) return false;
			}
		}
		if (!new_album || !pptBio.loadCovAllFb) {
			const key = this.cov.images[this.cov.ix];
			if (!key) return false;
			this.loadImg(cov, key, true, this.cov.ix, this.isEmbedded('stnd', this.cov.ix));
		}
		return true;
	}

	getFbImg() {
		if (pptBio.artistView && this.art.images.length && pptBio.cycPhoto) return;
		this.cov.ix = this.cov.cycle && !panelBio.alb.ix ? this.cov.cycle_ix : panelBio.alb.ix + 1000000;
		this.blurCheck();
		if (this.getCovImages()) return;
		if (panelBio.alb.ix && panelBio.alb.ix < panelBio.alb.list.length && !pptBio.artistView) { // !stndAlb
			const a = panelBio.alb.list[panelBio.alb.ix].artist;
			const l = panelBio.alb.list[panelBio.alb.ix].album;
			const l_handle = libBio.inLibrary(2, a, l);
			if (l_handle) { // check local
				this.getImg(l_handle, 0, false);
				return;
			}
			else {
				const pth = panelBio.getPth('img', pptBio.focus, a, l, '', cfg.supCache);
				if (this.chkPths(pth.pe, pth.fe, 0)) return;
				if (pth.fe != this.cov.done && cfg.dlRevImg) {
					const pth_cov = pth.pe[!cfg.supCache ? 0 : 1];
					const fn_cov = pth_cov + pth.fe;
					if (panelBio.serverBio) serverBio.getRevImg(a, l, pth_cov, fn_cov, false);
					else window.NotifyOthers('bio_getRevImg', [a, l, pth_cov, fn_cov]);
					this.cov.done = pth.fe;
				}
				this.setStub(cov, this.stub.cov.path, false, 0, this.stub.cov.user);
				return;
			}
		}
		if (!panelBio.alb.ix && cfg.cusCov && !pptBio.artistView && !pptBio.covType) {
			if (this.chkPths(cfg.cusCovPaths, '', 0, true)) return;
		}
		if (panelBio.art.ix && panelBio.art.ix < panelBio.art.list.length && pptBio.artistView) { // !stndBio
			const a_handle = libBio.inLibrary(3, this.artist);
			if (a_handle) {
				this.getImg(a_handle, 4, false);
				return;
			}
			this.setStub(art, this.stub.art.path, false, 1, this.stub.art.user);
			return;
		}
		// stndAlb
		const handle = $Bio.handle(pptBio.focus);
		if (handle) {
			this.getImg(handle, pptBio.artistView ? 4 : pptBio.covType, !pptBio.covType || pptBio.artistView ? false : true);
			return;
		}
		if (fb.IsPlaying && handle) return;
		if (panelBio.id.imgText) txt.text = true;
		this.setStub(this.cache(), 'noitem', true, 2);
	}

	getImg(handle, id, needStub) {
		this.cur_handle = handle;
		utils.GetAlbumArtAsync(window.ID, handle, id, needStub);
	}

	getImgFallback() {
		if (txt.scrollbar_type().draw_timer) return;
		if (!panelBio.updateNeeded()) {
			this.paint();
			this.get = false;
			return;
		}
		this.getImages();
		this.get = false;
	}

	getItem(art_ix, alb_ix, force) {
		switch (true) {
			case pptBio.artistView: {
				if (pptBio.text_only && !uiBio.style.isBlur && !pptBio.showFilmStrip) return;
				this.cur_artist = this.artist;
				const stndBio = panelBio.stnd(art_ix, panelBio.art.list);
				this.artist = !stndBio ? panelBio.art.list[art_ix].name : !panelBio.lock ? name.artist(pptBio.focus) : panelBio.art.list.length ? panelBio.art.list[0].name : this.artist;
				const new_artist = this.artist && this.artist != this.cur_artist || !this.artist || force;
				if (new_artist) {
					menBio.counter.bio = 0;
					art_scroller.reset();
				}
				if (pptBio.cycPhoto) {
					if (new_artist) {
						this.counter = 0;
						this.art.folder = panelBio.lock ? panelBio.cleanPth(cfg.remap.foImgArt, pptBio.focus, 'remap', this.artist, '', 1) : stndBio ? panelBio.cleanPth(cfg.pth.foImgArt, pptBio.focus) : panelBio.cleanPth(cfg.remap.foImgArt, pptBio.focus, 'remap', this.artist, '', 1);
						this.art.folderSup = '';
						if (!stndBio && cfg.supCache && !$Bio.folder(this.art.folder)) this.art.folderSup = panelBio.cleanPth(cfg.sup.foImgArt, pptBio.focus, 'remap', this.artist, '', 1);
						this.clearArtCache(true);
						this.art.done = false;
						if (!this.art.images.length) this.art.allFilesLength = 0;
						this.art.ix = 0;
					}
					this.getArtImg();
				} else this.getFbImg();
				this.get = false;
				break;
			}
			case !pptBio.artistView: {
				const stndAlb = !alb_ix || alb_ix + 1 > panelBio.alb.list.length;
				if (stndAlb) this.resetCounters();
				else if (!panelBio.lock) {
					this.id.curAlbum = this.id.album;
					this.id.album = (!panelBio.art.ix ? this.artist : panelBio.art.list[0].name) + panelBio.alb.list[alb_ix].name;
					if (this.id.album != this.id.curAlbum || force) {
						this.counter = 0;
						menBio.counter.rev = 0;
					}
				}
				txt.rev.lookUp = true;
				this.getFbImg();
				this.get = false;
				break;
			}
		}
	}

	getOrientation() {
		this.style.horizontal = (pptBio.style == 0 || pptBio.style == 2 || pptBio.style > 3) && !pptBio.img_only && txt.text;
		this.style.vertical = (pptBio.style == 1 || pptBio.style == 3 || pptBio.style > 3 && !pptBio.alignAuto) && !pptBio.img_only && txt.text;
		this.style.circular = this.isType('Circ');
	}

	getOverlayMetrics(image) {
		const s1 = image.Width / image.Height;
		const s2 = this.nw / this.nh;
		if (s1 > s2) {
			const sc = Math.min(this.nh / image.Height, this.nw / image.Width);
			this.im.h = Math.round(image.Height * sc);
			this.im.t = Math.round((this.nh - this.im.h) / 2 + this.im.t);
		} else {
			this.im.t = panelBio.img.t;
			this.nh = Math.max(panelBio.h - panelBio.img.t - panelBio.img.b - this.bor.w2, 10);
		}
	}

	grab(force) {
		if (panelBio.block()) return this.get = true;
		this.getArtImg(true);
		if (force) this.getFbImg();
	}

	images(v) {
		if (!$Bio.file(v)) return false;
		const fileSize = utils.GetFileSize(v);
		return (name.isLfmImg(fso.GetFileName(v), this.artist) || !pptBio.imgFilterLfm && /(?:jpe?g|gif|png|bmp)$/i.test(fso.GetExtensionName(v)) && !/ - /.test(fso.GetBaseName(v))) && !this.exclArr.includes(fileSize) && !this.blackListed(v);
	}

	isEmbedded(type, ix) { // also identifies yt etc
		switch (type) {
			case 'stnd':
				if (pptBio.artistView || !this.cov.list[ix]) return null;
				else return this.cov.list[ix].embedded;
			case 'thumb':
				if (this.cache().embedded) return this.cache().embedded;
				else if (pptBio.artistView || !this.cov.list[ix]) return null;
				else return this.cov.list[ix].embedded;
		}
	}

	isImageDark(image) {
		const colorSchemeArray = JSON.parse(image.GetColourSchemeJSON(15));
		let rTot = 0;
		let gTot = 0;
		let bTot = 0;
		let freqTot = 0;
		colorSchemeArray.forEach(v => {
			const col = $Bio.toRGB(v.col);
			rTot += col[0] ** 2 * v.freq;
			gTot += col[1] ** 2 * v.freq;
			bTot += col[2] ** 2 * v.freq;
			freqTot += v.freq;
		});
		const avgCol = [$Bio.clamp(Math.round(Math.sqrt(rTot / freqTot)), 0, 255), $Bio.clamp(Math.round(Math.sqrt(gTot / freqTot)), 0, 255), $Bio.clamp(Math.round(Math.sqrt(bTot / freqTot)), 0, 255)];
		return uiBio.getSelCol(avgCol, true, true) == 50 ? true : false;
	}

	isType(n, image) {
		switch (n) { // init before createImages & this.setCrop
			case 'AnyBor':
				return ['artBorderImgOnly', 'artShadowImgOnly', 'artBorderDual', 'artShadowDual', 'covBorderImgOnly', 'covShadowImgOnly', 'covBorderDual', 'covShadowDual'].some(v => pptBio[v]);
			case 'Blur':
				return uiBio.style.isBlur && !(pptBio.img_only && this.style.crop && this.style.border < 2) ? image.Clone(0, 0, image.Width, image.Height) : null;
			case 'Fade':
				return !pptBio.typeOverlay && pptBio.style > 3 && txt.text && !pptBio.img_only;
			case 'Overlay':
				return pptBio.style > 3 && pptBio.alignAuto && txt.text && !pptBio.img_only;
			case 'Circ':
				switch (pptBio.artistView) {
					case true:
						return !pptBio.img_only ? pptBio.artStyleDual == 2 : pptBio.artStyleImgOnly == 2;
					case false:
						return !pptBio.img_only ? pptBio.covStyleDual == 2 : pptBio.covStyleImgOnly == 2;
				}
				break;
				case 'Border':
					switch (pptBio.artistView) {
						case true:
							return pptBio.artBorderDual && pptBio.artShadowDual || pptBio.artBorderImgOnly && pptBio.artShadowImgOnly ? 3 : pptBio.artShadowDual || pptBio.artShadowImgOnly ? 2 : pptBio.artBorderDual || pptBio.artBorderImgOnly ? 1 : 0;
						case false:
							return pptBio.covBorderDual && pptBio.covShadowDual || pptBio.covBorderImgOnly && pptBio.covShadowImgOnly ? 3 : pptBio.covShadowDual || pptBio.covShadowImgOnly ? 2 : pptBio.covBorderDual || pptBio.covBorderImgOnly ? 1 : 0;
					}
					break;
					default:
						switch (pptBio.artistView) {
							case true:
								return !pptBio.img_only ? pptBio[`art${n}Dual`] : pptBio[`art${n}ImgOnly`];
							case false:
								return !pptBio.img_only ? pptBio[`cov${n}Dual`] : pptBio[`cov${n}ImgOnly`];
						}
		}
	}

	lbtn_dn(p_x) {
		if (!pptBio.touchControl || panelBio.trace.text || this.dn) return;
		this.touch.dn = true;
		this.touch.start = p_x;
	}

	lbtn_up() {
		if (this.touch.dn) this.touch.dn = false;
	}

	leave() {
		if (this.touch.dn) {
			this.touch.dn = false;
			this.touch.start = 0;
		}
	}

	loadAltCov(handle, n) {
		let a, l;
		switch (n) {
			case 0: // stndAlb !fbImg: chkCov save pths: if !found chk/save stubCovUser
				a = name.albumArtist(pptBio.focus);
				l = name.album(pptBio.focus);
				if (this.chkPths([panelBio.getPth('cov', pptBio.focus).pth, panelBio.getPth('img', pptBio.focus, a, l).pth], '', 0)) return true;
				if (cov.cacheHit(this.stub.cov.path)) return true;
				this.checkUserStub('cov', handle);
				return false;
			case 1: { // !stndAlb inLib !fbImg: chkCov save pths: if !found getRevImg else load stub || metadb
				a = panelBio.alb.list[panelBio.alb.ix].artist;
				l = panelBio.alb.list[panelBio.alb.ix].album;
				const pth = panelBio.getPth('img', pptBio.focus, a, l, '', cfg.supCache);
				if (this.chkPths(pth.pe, pth.fe, 0)) return;
				if (pth.fe != this.cov.done && cfg.dlRevImg) {
					const pth_cov = pth.pe[!cfg.supCache ? 0 : 1];
					const fn_cov = pth_cov + pth.fe;
					if (panelBio.serverBio) serverBio.getRevImg(a, l, pth_cov, fn_cov, false);
					else window.NotifyOthers('bio_getRevImg', [a, l, pth_cov, fn_cov]);
					this.cov.done = pth.fe;
				}
				this.setStub(cov, this.stub.cov.path, false, 0, this.stub.cov.user);
				return;
			}
		}
	}

	loadArtImage() {
		if (this.art.images.length && pptBio.cycPhoto) this.loadImg(art, this.art.images[this.art.ix], true, this.art.ix);
		else if (!this.init) this.getFbImg();
	}

	loadCycCov(handle, art_id, image, image_path) { // stndAlb
		if (!this.cov.cycle) return false;
		if (this.blackListed(image_path)) image_path = '';
		if (pptBio.loadCovAllFb) {
			if (this.cov.list.every(v => {
					return v.id !== art_id

				})) {
				this.cov.counter++;
				if (!art_id) {
					let path = '';
					if (cfg.cusCov) path = this.chkPths(cfg.cusCovPaths, '', 3, true);
					if (image_path && !cfg.cusCov || !path) path = image_path;
					if (!path) path = this.chkPths([panelBio.getPth('cov', pptBio.focus).pth, panelBio.getPth('img', pptBio.focus, name.albumArtist(pptBio.focus), name.album(pptBio.focus)).pth], '', 3);
					if (path) {
						const ln = this.cov.list.length;
						this.cov.list[ln] = {};
						this.cov.list[ln].id = art_id;
						const embedded = handle.Path == path;
						this.cov.list[ln].embedded = embedded ? image : null;
						if (embedded) path += art_id;
						this.cov.list[ln].pth = path;
					}
				} else if (image_path) {
					const ln = this.cov.list.length;
					this.cov.list[ln] = {};
					this.cov.list[ln].id = art_id;
					const embedded = handle.Path == image_path;
					this.cov.list[ln].embedded = embedded ? image : null;
					if (embedded) image_path += art_id;
					this.cov.list[ln].pth = image_path;
				}
				this.cov.list = this.cov.list.filter(Boolean);
				this.sort(this.cov.list, 'id');
				this.cov.list = this.uniqPth(this.cov.list);
				this.cov.images = this.cov.list.map(v => v.pth);
				filmStrip.check();
			}
		}

		if (!pptBio.artistView && !panelBio.alb.ix) {
			const key = this.cov.images[this.cov.ix];
			if (this.cov.counter > (pptBio.loadCovAllFb ? imgBio.cov.selFiltered.length : 0) - 1) {
				if (key) this.loadImg(cov, key, false, this.cov.ix, this.isEmbedded('stnd', this.cov.ix));
				seeker.metrics(this.style.circular, this.style.crop, this.style.horizontal, this.style.vertical);
				if (!this.cov.list.length) return false; // load stub
			}
			return true;
		}
	}

	loadImg(ca, key, chkCache, id, embeddedImg) {
		if (chkCache && ca.cacheHit(key)) return;
		if (!embeddedImg) {
			ca.cache[key] = {
				id: id
			};
			gdi.LoadImageAsync(window.ID, key);
		} else cov.cacheIt(embeddedImg, key);

	}

	loadStndCov(handle, art_id, image, image_path, embedded) { // stndAlb load fbImg else stub
		if (this.blackListed(image_path)) {
			image = null;
			image_path = '';
		}
		if (!image) {
			if (pptBio.artistView) {
				if (art.cacheHit(this.stub.art.path)) return;
				this.checkUserStub('art', handle);
				if (this.stub.art.user) {
					image = this.stub.art.user;
					image_path = this.stub.art.path;
				} // chk/save/load stubArtUser
			} else {
				if (cov.cacheHit(this.stub.cov.path)) return;
				this.checkUserStub('cov', handle);
				if (this.stub.cov.user) {
					image = this.stub.cov.user;
					image_path = this.stub.cov.path;
				}
			}
		}
		if (!image) {
			this.setStub(this.cache(), 'stub' + art_id, true, pptBio.artistView ? 1 : 0);
			return;
		}
		if (!txt.rev.lookUp) this.clearCovCache();
		this.cache().cacheIt(image, image_path + (!embedded ? '' : art_id), embedded);
	}

	memoryLimit() {
		if (!window.JsMemoryStats) return;
		return window.JsMemoryStats.MemoryUsage / window.JsMemoryStats.TotalMemoryLimit > 0.4 || window.JsMemoryStats.TotalMemoryUsage / window.JsMemoryStats.TotalMemoryLimit > 0.8;
	}

	metrics() {
		this.setAutoDisplayVariables();
		this.getOrientation();
		seeker.metrics(this.style.circular, this.style.crop, this.style.horizontal, this.style.vertical);
	}

	move(p_x, p_y) {
		if (this.touch.dn) {
			if (!panelBio.imgBoxTrace(p_x, p_y)) return;
			this.touch.end = p_x;
			const x_delta = this.touch.end - this.touch.start;
			if (x_delta > panelBio.style.imgSize / 5) {
				this.wheel(1);
				this.touch.start = this.touch.end;
			}
			if (x_delta < -panelBio.style.imgSize / 5) {
				this.wheel(-1);
				this.touch.start = this.touch.end;
			}
		}
	}

	needTrim(n, ratio) {
		return n || Math.abs(ratio - 1) >= 0.05;
	}

	on_get_album_art_done(handle, art_id, image, image_path) {
		const embedded = handle.Path == image_path;
		if (!this.cur_handle || !this.cur_handle.Compare(handle) || image && this.cache().cacheHit(image_path + (!embedded ? '' : art_id))) return;
		if (this.loadCycCov(handle, art_id, image, image_path)) return;
		if (panelBio.alb.ix && panelBio.alb.ix < panelBio.alb.list.length && !image && !pptBio.artistView) return this.loadAltCov(handle, 1);
		if (!image && !pptBio.artistView && !art_id && !panelBio.alb.ix) {
			if (this.loadAltCov(handle, 0)) return;
			if (this.stub.cov.user) {
				image = this.stub.cov.user;
				image_path = this.stub.cov.path;
			}
		}
		this.loadStndCov(handle, art_id, image, image_path, embedded);
	}

	on_load_image_done(image, image_path) {
		const caller = this.getCallerId(image_path);
		if (caller.art_id === this.art.ix) {
			if (!image) {
				this.art.images.splice(this.art.ix, 1);
				if (this.art.images.length > 1) this.changePhoto(1);
				filmStrip.check('imgUpd');
				return;
			}
			if (this.filter.size && (!pptBio.imgFilterBothPx ? image.Width < this.filter.minPx && image.Height < this.filter.minPx : image.Width < this.filter.minPx || image.Height < this.filter.minPx) && this.art.images.length > this.filter.minNo) {
				this.art.images.splice(this.art.ix, 1);
				seeker.upd(false, false, true);
				if (pptBio.showFilmStrip) filmStrip.trimCache(image_path);
				this.changePhoto(1);
				filmStrip.check('imgUpd');
				return;
			}
			art.cacheIt(image, image_path);
		}
		if (caller.cov_id === this.cov.ix) {
			if (!txt.rev.lookUp && !this.cov.cycle) this.clearCovCache();
			if (!image) return;
			if (this.filter.size && this.cov.folderSameAsArt && this.cov.images.includes(image_path) && (!pptBio.imgFilterBothPx ? image.Width < this.filter.minPx && image.Height < this.filter.minPx : image.Width < this.filter.minPx || image.Height < this.filter.minPx) && this.cov.images.length > this.filter.minNo) {
				this.cov.list.splice(this.cov.ix, 1);
				this.cov.images.splice(this.cov.ix, 1);
				seeker.upd(false, false, true);
				if (pptBio.showFilmStrip) filmStrip.trimCache(image_path);
				this.changeCov(1);
				filmStrip.check('imgUpd');
				return;
			}
			cov.cacheIt(image, image_path);
		}
	}

	on_playback_new_track(force) {
		this.resetCounters();
		if (!panelBio.updateNeeded() && !force) return;
		if (panelBio.block()) {
			this.get = true;
			filmStrip.logScrollPos();
			this.artistReset();
		} else {
			if (pptBio.artistView && pptBio.cycPhoto) {
				filmStrip.logScrollPos();
				this.artistReset();
				this.getArtImg();
			} else this.getFbImg();
			this.get = false;
		}
	}

	on_size() {
		if (pptBio.text_only) {
			this.clearCovCache();
			this.getFbImg();
		}
		if (pptBio.text_only && !uiBio.style.isBlur && !pptBio.showFilmStrip) return this.init = false;
		filmStrip.logScrollPos();
		this.clearCache();
		if (pptBio.artistView) {
			if (this.init) this.artistReset();
			this.getArtImg();
		} else this.getFbImg();
		this.init = false;
		if (pptBio.img_only) panelBio.getList(true);
		butBio.refresh(true);
	}

	paint() {
		if (!pptBio.imgSmoothTrans) {
			this.style.alpha = 255;
			txt.paint();
			return;
		}
		this.id.curImg = this.id.img;
		this.id.img = this.cur_pth();
		if (this.id.curImg != this.id.img) this.style.alpha = this.transition.level;
		else this.style.alpha = 255;
		timer.clear(timer.transition);
		timer.transition.id = setInterval(() => {
			this.style.alpha = Math.min(this.style.alpha *= this.transition.incr, 255);
			txt.paint();
			if (this.style.alpha == 255) timer.clear(timer.transition);
		}, 12);
	}

	pth() {
		const cur_pth = this.cur_pth();
		return {
			imgPth: (pptBio.text_only && !panelBio.style.showFilmStrip) || !$Bio.file(cur_pth) ? '' : cur_pth,
			artist: this.artist || name.artist(pptBio.focus),
			blk: name.isLfmImg(fso.GetFileName(cur_pth))
		};
	}

	process(image, n, o) {
		this.metrics();
		this.style.blur = this.isType('Blur', image);
		this.style.fade = this.isType('Fade');
		this.style.overlay = this.isType('Overlay');
		this.style.reflection = this.isType('Refl');
		let type = this.style.circular ? 'circular' : !this.style.crop ? 'default' : 'crop';
		switch (type) {
			case 'circular':
				if (this.style.overlay) this.nh = Math.max(panelBio.h - panelBio.img.t - panelBio.img.b - this.bor.w2, 10);
				this.im.w = this.im.h = Math.min(this.nw, this.nh);
				break;
			case 'default':
				if (this.style.overlay) this.getOverlayMetrics(image);
				this.im.w = this.nw;
				this.im.h = this.nh;
				break;
			case 'crop':
				if (pptBio.style > 3 && txt.text) this.nh = Math.max(panelBio.h - panelBio.img.t - panelBio.img.b - this.bor.w2, 10);
				this.im.w = this.nw;
				this.im.h = this.nh;
				break;
		}
		return this.format(image, n, type, this.im.w, this.im.h, 'img', o, this.style.blur, this.style.border, this.style.fade, this.style.reflection);
	}

	processSizeFilter() {
		pptBio.imgFilterMinNo = Math.round(Math.max($Bio.value(pptBio.imgFilterMinNo, 3, 0), 1));
		pptBio.imgFilterMaxSz = Math.round(Math.max($Bio.value(pptBio.imgFilterMaxSz, 12000, 0), 50));
		pptBio.imgFilterMinSz = Math.round(Math.max($Bio.value(pptBio.imgFilterMinSz, 50, 0), 0));
		pptBio.imgFilterMinPx = Math.round(Math.max($Bio.value(pptBio.imgFilterMinPx, 500, 0), 0));
		this.filter.size = pptBio.imgFilterMaxSzEnabled || pptBio.imgFilterMinSzEnabled || pptBio.imgFilterMinPxEnabled;
		if (this.filter.size) {
			this.filter.minNo = pptBio.imgFilterMinNo;
			this.filter.maxSz = pptBio.imgFilterMaxSzEnabled ? pptBio.imgFilterMaxSz * 1024 : Infinity;
			this.filter.minSz = pptBio.imgFilterMinSzEnabled ? pptBio.imgFilterMinSz * 1024 : 0;
			this.filter.minPx = pptBio.imgFilterMinPxEnabled ? pptBio.imgFilterMinPx : 0;
		}
	}

	reflImage(image, x, y, w, h, o) {
		if (!this.mask.reflection) {
			const km = this.refl.gradient != -1 ? this.refl.strength / 500 + this.refl.gradient / 10 : 0;
			this.mask.reflection = $Bio.gr(500, 500, true, g => {
				for (let k = 0; k < 500; k++) {
					const c = 255 - $Bio.clamp(this.refl.strength - k * km, 0, 255);
					g.FillSolidRect(0, k, 500, 1, RGB(c, c, c));
				}
			});
		}
		let r_mask, refl, reflImg, ref_sz, sw = 0;
		if (!pptBio.imgReflType) { // auto
			switch (pptBio.style) {
				case 0:
				case 2:
					sw = pptBio.alignH == 1 ? pptBio.style : pptBio.alignH == 0 ? 3 : 1;
					break;
				case 1:
				case 3:
					sw = pptBio.alignV == 1 ? pptBio.style : pptBio.alignV == 0 ? 0 : 2;
					break;
				default:
					sw = pptBio.alignH == 1 ? 0 : 3 - pptBio.alignH;
					break;
			}
		} else sw = [2, 3, 0, 1][pptBio.imgReflType - 1];
		this.refl.adjust = false;
		switch (sw) {
			case 0: // bottom
				ref_sz = Math.round(Math.min(panelBio.h - y - h, image.Height * this.refl.size));
				if (ref_sz <= 0) return image;
				refl = image.Clone(0, image.Height - ref_sz, image.Width, ref_sz);
				r_mask = this.mask.reflection.Clone(0, 0, this.mask.reflection.Width, this.mask.reflection.Height);
				if (refl) {
					r_mask = r_mask.Resize(refl.Width, refl.Height);
					refl.RotateFlip(6);
					refl.ApplyMask(r_mask);
				}
				reflImg = $Bio.gr(w, h + ref_sz, true, g => {
					g.DrawImage(image, 0, 0, w, h, 0, 0, w, h);
					g.DrawImage(refl, 0, h, w, h, 0, 0, w, h);
				});
				o.h = h + ref_sz;
				break;
			case 1: // left
				ref_sz = Math.round(Math.min(x, image.Width * this.refl.size));
				if (ref_sz <= 0) return image;
				refl = image.Clone(0, 0, ref_sz, image.Height);
				r_mask = this.mask.reflection.Clone(0, 0, this.mask.reflection.Width, this.mask.reflection.Height);
				r_mask.RotateFlip(1);
				if (refl) {
					r_mask = r_mask.Resize(refl.Width, refl.Height);
					refl.RotateFlip(4);
					refl.ApplyMask(r_mask);
				}
				reflImg = $Bio.gr(ref_sz + w, h, true, g => {
					g.DrawImage(image, ref_sz, 0, w, h, 0, 0, w, h);
					g.DrawImage(refl, 0, 0, ref_sz, h, 0, 0, ref_sz, h);
				});
				o.x = this.x = x - ref_sz;
				o.w = w + ref_sz;
				break;
			case 2: // top
				ref_sz = Math.round(Math.min(y, image.Height * this.refl.size));
				if (ref_sz <= 0) return image;
				refl = image.Clone(0, 0, image.Width, ref_sz);
				r_mask = this.mask.reflection.Clone(0, 0, this.mask.reflection.Width, this.mask.reflection.Height);
				r_mask.RotateFlip(2);
				if (refl) {
					r_mask = r_mask.Resize(refl.Width, refl.Height);
					refl.RotateFlip(6);
					refl.ApplyMask(r_mask);
				}
				reflImg = $Bio.gr(w, ref_sz + h, true, g => {
					g.DrawImage(image, 0, ref_sz, w, h, 0, 0, w, h);
					g.DrawImage(refl, 0, 0, w, ref_sz, 0, 0, w, ref_sz);
				});
				o.y = this.y = y - ref_sz;
				o.h = ref_sz + h;
				break;
			case 3: // right
				ref_sz = Math.round(Math.min(panelBio.w - x - w, image.Width * this.refl.size));
				if (ref_sz <= 0) return image;
				refl = image.Clone(image.Width - ref_sz, 0, ref_sz, image.Height);
				r_mask = this.mask.reflection.Clone(0, 0, this.mask.reflection.Width, this.mask.reflection.Height);
				r_mask.RotateFlip(3);
				if (refl) {
					r_mask = r_mask.Resize(refl.Width, refl.Height);
					refl.RotateFlip(4);
					refl.ApplyMask(r_mask);
				}
				reflImg = $Bio.gr(w + ref_sz, h, true, g => {
					g.DrawImage(image, 0, 0, w, h, 0, 0, w, h);
					g.DrawImage(refl, w, 0, ref_sz, h, 0, 0, ref_sz, h);
				});
				o.w = w + ref_sz;
				break;
		}
		return reflImg;
	}

	resetCounters() {
		if (panelBio.lock) return;
		this.id.curAlbCounter = this.id.albCounter;
		this.id.albCounter = name.albID(pptBio.focus, 'full');
		if (this.id.albCounter != this.id.curAlbCounter || !this.id.albCounter) {
			this.counter = 0;
			menBio.counter.rev = 0;
		}
		this.id.curArtCounter = this.id.artCounter;
		this.id.artCounter = name.artist(pptBio.focus);
		if (this.id.artCounter && this.id.artCounter != this.id.curArtCounter || !this.id.artCounter) {
			this.counter = 0;
			menBio.counter.bio = 0;
		}
	}

	resetTimestamps() {
		if (!pptBio.cycPic) return;
		pptBio.artistView ? this.timeStamp.photo = Date.now() : this.timeStamp.cov = Date.now();
	}

	setAlbID() {
		this.id.curAlbCyc = this.id.albCyc;
		this.id.albCyc = name.albID(pptBio.focus, 'full');
	}

	setAlignment() {
		if (this.style.horizontal && pptBio.alignH != 1) {
			if (pptBio.alignH == 2) this.im.l = Math.round(panelBio.w - panelBio.img.r - this.im.w - this.bor.w2);
		} else this.im.l = Math.round((this.nw - this.im.w) / 2 + this.im.l);
		if (this.style.vertical && pptBio.alignV != 1) {
			if (pptBio.alignV == 2) this.im.t = Math.round(panelBio.h - panelBio.img.b - this.im.h - this.bor.w2);
		} else if (pptBio.style < 4 || !pptBio.alignAuto || !txt.text || pptBio.img_only) this.im.t = Math.round((this.nh - this.im.h) / 2 + this.im.t);
	}

	setAutoDisplayVariables() {
		if (!pptBio.img_only && txt.text && pptBio.textAlign && pptBio.style < 4) {
			if (pptBio.style == 0) {
				panelBio.img.l = panelBio.heading.x;
				panelBio.img.r = panelBio.w - panelBio.heading.x - panelBio.heading.w;
			}
			if (pptBio.style == 2) {
				panelBio.img.l = !panelBio.style.fullWidthHeading ? panelBio.heading.x : panelBio.heading.x + panelBio.filmStripSize.l;
				panelBio.img.r = !panelBio.style.fullWidthHeading ? panelBio.w - panelBio.heading.x - panelBio.heading.w : panelBio.w - panelBio.img.l - panelBio.heading.w + panelBio.filmStripSize.r;
			}
			if ((pptBio.style == 1 || pptBio.style == 3)) {
				panelBio.img.t = !panelBio.style.fullWidthHeading ? pptBio.textT + panelBio.filmStripSize.t : panelBio.text.t;
				panelBio.img.b = !panelBio.style.fullWidthHeading ? pptBio.textB + panelBio.filmStripSize.b : panelBio.h - panelBio.text.t - panelBio.text.h;
			}
		}
		if (!pptBio.img_only && txt.text && pptBio.style == 0 && panelBio.style.fullWidthHeading) {
			if (panelBio.filmStripSize.l) panelBio.img.l = panelBio.bor.l;
			if (panelBio.filmStripSize.r) panelBio.img.r = panelBio.bor.r;
		}

		$Bio.key.forEach(v => {
			this.im[v] = !txt.text ? panelBio.bor[v] + (!this.style.crop ? panelBio.filmStripSize[v] : 0) : panelBio.img[v]
		});

		this.nw = txt.text && (!pptBio.style || pptBio.style == 2 || pptBio.style > 3) ? panelBio.w - panelBio.img.l - panelBio.img.r : !pptBio.img_only && txt.text ? panelBio.style.imgSize : panelBio.w - this.im.l - this.im.r;
		this.nh = txt.text && (pptBio.style == 1 || pptBio.style == 3 || pptBio.style > 3 && !pptBio.alignAuto) ? panelBio.h - panelBio.img.t - panelBio.img.b : !pptBio.img_only && txt.text ? panelBio.style.imgSize : panelBio.h - this.im.t - this.im.b;

		this.style.border = this.isType('Border');
		if (this.style.border == 1 || this.style.border == 3) {
			const i_sz = $Bio.clamp(this.nh, 0, this.nw) / $Bio.scale;
			this.bor.w1 = !i_sz || i_sz > 500 ? 5 * $Bio.scale : Math.ceil(5 * $Bio.scale * i_sz / 500);
		} else this.bor.w1 = 0;
		this.bor.w2 = this.bor.w1 * 2;
		this.nw = Math.max(this.nw - this.bor.w2, 10);
		this.nh = Math.max(this.nh - this.bor.w2, 10);
	}

	setCheckArr(arr_ix) {
		this.art.checkArr = [window.ID, arr_ix, this.art.displayedOtherPanel];
		window.NotifyOthers('bio_checkImgArr', this.art.checkArr);
	}

	setCrop(sz) {
		const imgRefresh = pptBio.img_only || !pptBio.text_only && !txt.text;
		this.style.crop = this.isType('Circ') ? false :
			pptBio.artistView && (pptBio.artStyleImgOnly == 1 && imgRefresh || pptBio.artStyleDual == 1 && !pptBio.img_only) || !pptBio.artistView && (pptBio.covStyleImgOnly == 1 && imgRefresh || pptBio.covStyleDual == 1 && !pptBio.img_only);
		panelBio.setBorder(imgRefresh && this.style.crop, this.isType('Border'), this.isType('Refl'));
		if (sz) {
			panelBio.setStyle();
			if (pptBio.heading && !pptBio.img_only) butBio.check();
		}
	}

	setReflStrength(n) {
		this.refl.strength += n;
		this.refl.strength = $Bio.clamp(this.refl.strength, 0, 255);
		pptBio.reflStrength = Math.round(this.refl.strength / 2.55);
		this.mask.reflection = false;
		this.refl.adjust = true;
		if (pptBio.artistView && pptBio.cycPhoto) this.clearArtCache();
		if (panelBio.stndItem()) this.getImages();
		else this.getItem(panelBio.art.ix, panelBio.alb.ix);
	}

	setStub(ca, key, def, n, userStub) {
		if (ca.cacheHit(key)) return;
		switch (def) {
			case false:
				if (userStub) ca.cacheIt(userStub, key);
				else this.setStub(ca, 'stub', true, n);
				break;
			case true:
				ca.cacheIt(this.stub.default[n].Clone(0, 0, this.stub.default[n].Width, this.stub.default[n].Height), key);
				break;
		}
	}

	sizeFilter(v, i, arr) {
		const fileSize = utils.GetFileSize(v);
		if (arr.length - this.removed <= this.filter.minNo || fileSize <= this.filter.maxSz && fileSize > this.filter.minSz) return true;
		this.removed++;
	}

	sort(data, prop) {
		data.sort((a, b) => a[prop] - b[prop]);
		return data;
	}
	sortCache(o, prop) {
		const sorted = {};
		Object.keys(o).sort((a, b) => o[a][prop] - o[b][prop]).forEach(key => sorted[key] = o[key]);
		return sorted;
	}

	toggle(n) {
		pptBio.toggle(n);
		this.cov.cycle = pptBio.loadCovAllFb || pptBio.loadCovFolder;
		this.cov.cycle_ix = 0;
		if (n == 'loadCovFolder' && pptBio.loadCovFolder && !pptBio.get('SYSTEM.Cover Folder Checked', false)) {
			fb.ShowPopupMessage("Enter folder in options: \"Server Settings\"\\Cover\\Covers: cycle folder.\n\nDefault: artist photo folder.\n\nImages are updated when the album changes. Any images arriving after choosing the current album aren't included.", 'Biography: load folder for cover cycling');
			pptBio.set('SYSTEM.Cover Folder Checked', true);
		}
		this.id.albCyc = '';
		this.id.curAlbCyc = '';
		if (pptBio.artistView) {
			seeker.upd(false, !this.cov.cycle);
			return;
		}
		if (this.cov.cycle) this.getCovImages();
		else this.getImages();
		seeker.upd(false, !this.cov.cycle);
	}

	trace(x, y) {
		if (!pptBio.autoEnlarge) return true;
		const o = this.cache().cache[this.cur_pth()];
		if (!o) return false;
		return x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h;
	}

	uniq(a) {
		return [...new Set(a)];
	}

	uniqPth(a) {
		const flags = [];
		let result = [];
		a.forEach(v => {
			const vpth = v.pth.toLowerCase();
			if (flags[vpth]) return;
			result.push(v);
			flags[vpth] = true;
		});
		return result;
	}

	updImages() {
		this.id.albCyc = '';
		this.id.curAlbCyc = '';
		this.clearArtCache(true);
		this.clearCovCache();
		filmStrip.scroll.pos.art = {};
		if (panelBio.stndItem()) this.getImages(true);
		else this.getItem(panelBio.art.ix, panelBio.alb.ix, true);
	}

	wheel(step) {
		switch (vkBio.k('shift')) {
			case false:
				if (this.art.images.length > 1 && pptBio.artistView && !pptBio.text_only && pptBio.cycPhoto) {
					this.changePhoto(-step);
					if (pptBio.cycPic) this.timeStamp.photo = Date.now();
				}
				if (this.cov.cycle && this.cov.images.length > 1 && !pptBio.artistView && !pptBio.text_only && !panelBio.alb.ix) {
					this.changeCov(-step);
					if (this.cov.cycle) this.timeStamp.cov = Date.now();
				}
				break;
			case true:
				if (!panelBio || butBio.trace('lookUp', panelBio.m.x, panelBio.m.y) || panelBio.trace.text || panelBio.trace.film || !this.isType('Refl')) break;
				this.setReflStrength(-step * 5);
				break;
		}
	}
}

class ImageCache {
	constructor(type) {
		this.cache = {};
		this.pth = '';
		this.type = type;
	}

	// Methods

	checkCache() {
		let keys = Object.keys(this.cache);
		const cacheLength = keys.length;
		const minCacheSize = 5;
		if (cacheLength > minCacheSize) {
			this.cache = imgBio.sortCache(this.cache, 'time');
			keys = Object.keys(this.cache);
			const numToRemove = Math.round((cacheLength - minCacheSize) / 5);
			if (numToRemove > 0)
				for (let i = 0; i < numToRemove; i++) this.trimCache(keys[i]);
		}
	}

	cacheIt(image, key, embedded) {
		try {
			if (!image || this.type != pptBio.artistView) return imgBio.paint();
			if (imgBio.memoryLimit()) this.checkCache();
			if (!pptBio.text_only || uiBio.style.isBlur) {
				const start = Date.now();
				const o = this.cache[key] = {};
				o.img = imgBio.cur = imgBio.process(image, this.type, o);
				o.text = txt.text;
				o.filmID = filmStrip.id();
				o.time = Date.now() - start;
			}
			this.pth = key;
			this.embedded = embedded && pptBio.showFilmStrip && !filmStrip.style.auto ? image : null;
			filmStrip.check();
			imgBio.paint();
		} catch (e) {
			this.pth = '';
			imgBio.paint();
			$Bio.trace('unable to load image: ' + key);
		}
	}

	cacheHit(key) {
		if (pptBio.text_only && !uiBio.style.isBlur) {
			this.pth = key;
			return;
		}
		const o = this.cache[key];
		if (!o || !o.img || !pptBio.img_only && o.text != txt.text || o.filmID != filmStrip.id() || imgBio.refl.adjust) return false;
		imgBio.x = o.x;
		seeker.counter.x = o.counter_x;
		imgBio.y = o.y;
		seeker.counter.y = o.counter_y;
		if (uiBio.style.isBlur && o.blur && !(pptBio.img_only && imgBio.style.crop)) imgBio.blur = o.blur;
		imgBio.cur = o.img;
		this.pth = key;
		if (this.type && !imgBio.art.images.length || !this.type && ! imgBio.cov.images.length) filmStrip.check();
		else filmStrip.paint();
		imgBio.paint();
		return true;
	}

	trimCache(key) {
		delete this.cache[key];
	}
}

const art = new ImageCache(true);
const cov = new ImageCache(false);

class Seeker {
	constructor() {
		this.dn = false;
		this.disabled = false;
		this.hand = false;
		this.l_dn = false;
		this.imgNo = 0;
		pptBio.imgSeeker = $Bio.clamp(pptBio.imgSeeker, 0, 2);
		this.imgSeeker = pptBio.imgSeeker;
		this.nh = 10;
		this.nw = 10;
		this.overlap = false;
		this.show = this.imgSeeker == 2 ? true : false;
		this.bar = {
			dot_w: 4,
			grip_h: 10 * $Bio.scale,
			gripOffset: 2,
			h: 6 * $Bio.scale,
			l: 0,
			x1: 25,
			x2: 26,
			x3: 25,
			y1: 25,
			y2: 200,
			y3: 201,
			y4: 200,
			y5: 200,
			w1: 100,
			w2: 110
		};
		this.counter = {
			x: 0,
			y: 0
		};
		this.corr = {
			overlap: 0,
			vertical: 1.1565
		};
		this.prog = {
			min: 0,
			max: 200
		}

		this.debounce = $Bio.debounce(() => {
			if (this.imgSeeker == 2 || panelBio.m.x > this.bar.x1 && panelBio.m.x < this.bar.x1 + this.bar.w1 && panelBio.m.y > this.bar.y1 + this.bar.y4 && panelBio.m.y < this.bar.y1 + this.bar.y5) return;
			this.show = false;
			imgBio.paint();
			filmStrip.paint();
		}, 3000);
	}

	draw(gr) {
		if (this.imgNo < 2 || !this.show) return;

		let prog = 0;
		if (pptBio.imgSeekerDots) {
			gr.SetSmoothingMode(2);
			prog = this.dn ? $Bio.clamp(panelBio.m.x - this.bar.x2 - this.bar.grip_h / 2, this.prog.min, this.prog.max) : (pptBio.artistView ? imgBio.art.ix + 0.5 : imgBio.cov.ix + 0.5) * this.bar.w1 / this.imgNo - (this.bar.grip_h - this.bar.dot_w) / 2;
			for (let i = 0; i < this.imgNo; i++) {
				gr.FillEllipse(this.bar.x2 + ((i + 0.5) / this.imgNo) * this.bar.w1, this.bar.y2, this.bar.dot_w, this.bar.h, RGB(245, 245, 245));
				gr.DrawEllipse(this.bar.x2 + ((i + 0.5) / this.imgNo) * this.bar.w1, this.bar.y2, this.bar.dot_w, this.bar.h, uiBio.style.l_w, RGB(128, 128, 128));
			}
			gr.FillEllipse(this.bar.x2 + prog, this.bar.y3 - this.bar.gripOffset, this.bar.grip_h, this.bar.grip_h, RGB(245, 245, 245));
			gr.DrawEllipse(this.bar.x2 + prog, this.bar.y3 - this.bar.gripOffset, this.bar.grip_h, this.bar.grip_h, uiBio.style.l_w, RGB(128, 128, 128));
			gr.SetSmoothingMode(0);
		}

		if (pptBio.imgCounter) {
			if (pptBio.imgSeekerDots) prog += Math.round(this.bar.grip_h / 2 - this.bar.dot_w / 2);
			const count = (pptBio.artistView ? imgBio.art.ix + 1 : imgBio.cov.ix + 1) + (' / ' + this.imgNo);
			const count_m = (this.imgNo + (' / ' + this.imgNo)) + ' ';
			if (count) {
				const count_w = Math.max(gr.CalcTextWidth(count_m, uiBio.font.small), 8);
				const count_x = pptBio.imgSeekerDots ? Math.round($Bio.clamp(this.bar.x1 - count_w / 2 + prog, this.bar.l + 2, this.bar.l + this.nw - count_w - 4)) : this.counter.x + uiBio.style.l_w * 2 + imgBio.bor.w1;
				const count_h = Math.max(gr.CalcTextHeight(count, uiBio.font.small), 8);
				const count_y = pptBio.imgSeekerDots ? Math.round(this.bar.y2 - this.bar.gripOffset - count_h * 1.5) : this.counter.y + uiBio.style.l_w * 2 + imgBio.bor.w1;
				gr.FillRoundRect(count_x, count_y, count_w + 2, count_h + 2, 3, 3, RGBA(0, 0, 0, 210));
				gr.DrawRoundRect(count_x + 1, count_y + 1, count_w, count_h, 1, 1, 1, RGBA(255, 255, 255, 60));
				gr.DrawRoundRect(count_x, count_y, count_w + 2, count_h + 2, 1, 1, 1, RGBA(0, 0, 0, 200));
				gr.GdiDrawText(count, uiBio.font.small, RGB(250, 250, 250), count_x + 1, count_y, count_w, count_h + 2, txt.cc);
			}
		}
	}

	intersectRect() {
		return !(panelBio.tbox.l > panelBio.ibox.l + panelBio.ibox.w || panelBio.tbox.l + panelBio.tbox.w < panelBio.ibox.l || panelBio.tbox.t > panelBio.ibox.t + panelBio.ibox.h || panelBio.tbox.t + panelBio.tbox.h < panelBio.ibox.t);
	}

	lbtn_dn(p_x, p_y) {
		this.dn = false;
		this.l_dn = true;
		if (pptBio.touchControl) {
			uiBio.id.touch_dn = filmStrip.get_ix(p_x, p_y);
		}
		if (this.imgSeeker) {
			if (this.imgNo > 1) this.dn = p_x > this.bar.x3 && p_x < this.bar.x3 + this.bar.w2 && p_y > this.bar.y1 + this.bar.y4 && p_y < this.bar.y1 + this.bar.y5;
			if (this.dn) {
				const prog = $Bio.clamp(p_x - this.bar.x1, 0, this.bar.w1);
				if (pptBio.artistView) {
					const new_ix = Math.min(Math.floor(prog / this.bar.w1 * imgBio.art.images.length), imgBio.art.images.length - 1);
					if (new_ix != imgBio.art.ix) {
						imgBio.art.ix = new_ix;
						imgBio.setPhoto();
					}
				} else {
					const new_i_x = Math.min(Math.floor(prog / this.bar.w1 * imgBio.cov.images.length), imgBio.cov.images.length - 1);
					if (new_i_x != imgBio.cov.ix) {
						 imgBio.cov.ix = new_i_x;
						imgBio.setCov();
					}
				}
				imgBio.paint();
				filmStrip.paint();
			}
		}
	}

	lbtn_up() {
		this.upd();
		this.dn = false;
		this.l_dn = false;
		if (this.imgSeeker) imgBio.paint();
		filmStrip.paint();
	}

	metrics(circular, crop, horizontal, vertical) {
		this.disabled = pptBio.style > 3 && !pptBio.img_only && txt.text && !panelBio.clip && this.intersectRect();
		this.imgSeeker = !this.disabled ? pptBio.imgSeeker : 0;
		if (!this.imgSeeker) {
			this.show = false;
			imgBio.paint();
			filmStrip.paint();
			return;
		} else if (this.imgSeeker == 2) this.show = true;

		this.imgNo = pptBio.text_only ? 0 : pptBio.cycPhoto && pptBio.artistView ? imgBio.art.images.length : imgBio.cov.cycle && !pptBio.artistView && !panelBio.alb.ix ? imgBio.cov.images.length : 0;
		if (this.imgNo < 2) return;

		this.overlap = pptBio.style > 3 && !pptBio.img_only && txt.text && panelBio.clip;
		this.corr.overlap = this.overlap ? panelBio.bor.t : 0;

		const alignBottom = vertical && !crop && pptBio.alignV == 2 && !this.overlap;
		const alignCenter = vertical && !crop && pptBio.alignV == 1 && !this.overlap;
		const alignLeft = horizontal && !crop && pptBio.alignH == 0;
		const alignRight = horizontal && !crop && pptBio.alignH == 2;

		this.corr.vertical = circular ? imgBio.style.border == 1 || imgBio.style.border == 3 ? 1 : 1 : 1.1565;
		this.nw = (!txt.text || pptBio.img_only) && crop ? imgBio.nw - panelBio.filmStripSize.l - panelBio.filmStripSize.r : imgBio.nw;
		this.nh = !txt.text || pptBio.img_only ? imgBio.nh - (!crop ? 0 : panelBio.filmStripSize.b) : pptBio.style < 4 ? Math.min(!crop ? this.nw * (!alignBottom ? this.corr.vertical : 1) : imgBio.nh, imgBio.nh) : this.overlap ? panelBio.style.imgSize : Math.min(!crop ? (panelBio.ibox.w - panelBio.bor.l - panelBio.bor.r) * (!alignBottom ? this.corr.vertical : 1) : panelBio.ibox.h - panelBio.bor.t - panelBio.bor.b, panelBio.ibox.h - panelBio.bor.t - panelBio.bor.b);
		const seeker_img_t = this.nw * (!alignBottom ? this.corr.vertical : 1) < imgBio.nh ? alignCenter ? (imgBio.nh - this.nw) / 2 : alignBottom ? imgBio.nh - this.nw : 0 : 0;
		this.bar.h = 6 * $Bio.scale;
		this.bar.grip_h = 10 * $Bio.scale;
		this.bar.gripOffset = Math.round((this.bar.grip_h - this.bar.h) / 2) + Math.ceil(uiBio.style.l_w / 2);
		const circ_sz = pptBio.style < 4 ? Math.min(this.nw, this.nh) : Math.min(panelBio.ibox.w - panelBio.bor.l - panelBio.bor.r, panelBio.ibox.h - panelBio.bor.t - panelBio.bor.b);
		this.bar.w1 = circular && (alignLeft || alignRight) ? Math.min(this.imgNo * 30 * $Bio.scale, circ_sz) : Math.min(this.imgNo * 30 * $Bio.scale, (!imgBio.style.crop ? Math.min(this.nw, this.nh) : this.nw) - 30 * $Bio.scale);
		this.bar.w2 = this.bar.w1 + Math.round(this.bar.grip_h);
		this.bar.l = !txt.text ? panelBio.bor.l + panelBio.filmStripSize.l : panelBio.img.l;
		this.bar.x1 = circular ? (alignLeft ? this.bar.l + (circ_sz - this.bar.w1) / 2 : alignRight ? this.bar.l + this.nw - circ_sz + (circ_sz - this.bar.w1) / 2 : Math.round(this.bar.l + (this.nw - this.bar.w1) / 2)) : (alignLeft ? Math.round(this.bar.l + 15 * $Bio.scale) : alignRight ? Math.round(panelBio.w - (!txt.text ? panelBio.bor.r : panelBio.img.r) - 15 * $Bio.scale - this.bar.w1) : Math.round(this.bar.l + (this.nw - this.bar.w1) / 2));
		this.bar.x3 = this.bar.x1 - Math.round(this.bar.grip_h / 2);
		this.bar.y1 = !txt.text ? panelBio.bor.t + seeker_img_t + panelBio.filmStripSize.t : panelBio.img.t + seeker_img_t;
		this.bar.y2 = Math.round(this.bar.y1 + this.nh * 0.9 - this.bar.h / 2) - this.corr.overlap;
		this.bar.y3 = this.bar.y2 + Math.ceil(uiBio.style.l_w / 2);
		this.bar.y4 = this.nh * 0.8 - this.corr.overlap;
		this.bar.y5 = this.nh - this.corr.overlap;

		if (pptBio.imgSeekerDots) {
			this.bar.dot_w = Math.floor($Bio.clamp(this.bar.w1 / this.imgNo, 2, this.bar.h));
			this.bar.x2 = this.bar.x1 - Math.round(this.bar.dot_w / 2);
			this.prog.min = 0.5 / this.imgNo * this.bar.w1 - (this.bar.grip_h - this.bar.dot_w) / 2;
			this.prog.max = ((this.imgNo - 0.5) / this.imgNo) * this.bar.w1 - (this.bar.grip_h - this.bar.dot_w) / 2;
		}
	}

	move(p_x, p_y) {
		this.hand = false;
		if (this.imgSeeker) {
			const trace = p_x > this.bar.l && p_x < this.bar.l + this.nw && p_y > this.bar.y1 && p_y < this.bar.y1 + this.bar.y5;
			const show = !pptBio.text_only && (pptBio.artistView || !panelBio.alb.ix) && (this.imgSeeker == 2 || trace);
			if (this.imgNo > 1 && (!this.l_dn || this.dn)) this.hand = p_x > this.bar.x3 && p_x < this.bar.x3 + this.bar.w2 && p_y > this.bar.y1 + this.nh * 0.8 - this.corr.overlap && p_y < this.bar.y1 + this.bar.y5;
			if (show != this.show && !pptBio.text_only && trace) {
				imgBio.paint();
				filmStrip.paint();
			}
			if (show) this.show = true;
			this.debounce();
		}

		if (this.dn) {
			const prog = $Bio.clamp(p_x - this.bar.x1, 0, this.bar.w1);
			if (pptBio.artistView) {
				const new_ix = Math.min(Math.floor(prog / this.bar.w1 * imgBio.art.images.length), imgBio.art.images.length - 1);
				if (new_ix != imgBio.art.ix) {
					imgBio.art.ix = new_ix;
					imgBio.setPhoto();
				}
			} else {
				const new_i_x = Math.min(Math.floor(prog / this.bar.w1 * imgBio.cov.images.length), imgBio.cov.images.length - 1);
				if (new_i_x != imgBio.cov.ix) {
					 imgBio.cov.ix = new_i_x;
					imgBio.setCov();
				}
			}
			imgBio.paint();
			filmStrip.paint();
		}
	}

	upd(force, clearCov, repaint) {
		if (pptBio.imgSeeker && (!this.dn && (!pptBio.text_only || uiBio.style.isBlur || force))) {
			if (clearCov) imgBio.cov.images = [];
			imgBio.metrics();
			if (repaint) txt.paint();
		}
	}
}