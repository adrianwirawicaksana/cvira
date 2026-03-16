/* ═══════════════════════════════════════════
   CVira — Main JavaScript
   Bug Fix: handleFreeStart() cek login sebelum buka modal
   ═══════════════════════════════════════════ */

'use strict';

/* ── STATE ── */
var skills = [];
var experiences = [];
var educations = [];
var currentUser = null;

/* ═══════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', function () {
    /* hide page loader */
    var loader = document.getElementById('pageLoader');
    if (loader) setTimeout(function () { loader.classList.add('hide'); }, 400);

    /* bootstrap form with one default entry each */
    addExperience();
    addEducation();

    /* auth & pricing */
    loadUser();
    handleAuthRedirect();
    setupPricingLinks();

    /* close login modal on backdrop click */
    var modal = document.getElementById('loginModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) closeLoginModal();
        });
    }

    /* ripple style injection */
    var rs = document.createElement('style');
    rs.textContent = '@keyframes ripple{to{transform:scale(1);opacity:0}}';
    document.head.appendChild(rs);

    /* ripple click handler */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('a.bg-yellow, button#generateBtn');
        if (!btn) return;
        var rip = document.createElement('span');
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 2;
        rip.style.cssText = [
            'position:absolute', 'border-radius:50%', 'background:rgba(255,255,255,0.35)',
            'width:' + size + 'px', 'height:' + size + 'px',
            'left:' + (e.clientX - rect.left - size / 2) + 'px',
            'top:' + (e.clientY - rect.top - size / 2) + 'px',
            'pointer-events:none', 'transform:scale(0)',
            'animation:ripple 0.55s ease-out forwards'
        ].join(';');
        if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(rip);
        setTimeout(function () { rip.remove(); }, 600);
    });

    /* scroll reveal */
    document.querySelectorAll('.reveal').forEach(function (el) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold: 0.12 }).observe(el);
    });

    /* stat counter animation */
    (function () {
        var triggered = false;
        var row = document.querySelector('.stat-num');
        if (!row) return;
        new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting || triggered) return;
            triggered = true;
            var targets = [['10', 'K+'], ['98', '%'], ['3', 's']];
            var els = document.querySelectorAll('.stat-num');
            targets.forEach(function (t, i) {
                if (!els[i]) return;
                var el = els[i];
                var tgt = parseFloat(t[0]);
                var sfx = t[1];
                var start = Date.now();
                var dur = 1800;
                (function tick() {
                    var p = Math.min((Date.now() - start) / dur, 1);
                    var ease = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.floor(ease * tgt) + sfx;
                    if (p < 1) requestAnimationFrame(tick);
                })();
            });
        }, { threshold: 0.5 }).observe(row);
    })();
});

/* navbar shadow on scroll */
window.addEventListener('scroll', function () {
    var nb = document.getElementById('navbar');
    if (nb) nb.classList.toggle('shadow-md', window.scrollY > 60);
});

/* close sidebar on desktop resize */
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        var d = document.getElementById('mobileDrawer');
        var ov = document.getElementById('sidebarOverlay');
        var h = document.getElementById('navHamburger');
        if (d) d.classList.remove('open');
        if (ov) ov.classList.remove('open');
        if (h) h.classList.remove('open');
        document.body.style.overflow = '';
    }
});

/* ═══════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════ */
function loadUser() {
    fetch('/auth/me')
        .then(function (r) { return r.json(); })
        .then(function (u) { currentUser = u; updateUserUI(u); })
        .catch(function () { updateUserUI({ loggedIn: false }); });
}

function handleAuthRedirect() {
    var p = new URLSearchParams(window.location.search);
    var auth = p.get('auth');
    var plan = p.get('plan');
    if (!auth) return;

    window.history.replaceState({}, '', '/');

    if (auth === 'ok') {
        showToast(
            plan === 'pro'
                ? 'Selamat datang! Paket Pro aktif.'
                : 'Berhasil masuk! Kamu menggunakan paket Free.',
            'success'
        );
    } else if (auth === 'expired') {
        showToast('Link masuk sudah kadaluarsa.', 'error');
    } else if (auth === 'invalid') {
        showToast('Link masuk tidak valid.', 'error');
    }

    /* handle Mayar.id callback */
    var mayarStatus = p.get('mayar_status');
    if (mayarStatus === 'success') {
        showToast('Pembayaran via Mayar.id berhasil! Paket Pro aktif 🎉', 'success');
        loadUser();
    }
}

function doLogout() {
    fetch('/auth/logout', { method: 'POST' }).then(function () {
        currentUser = null;
        updateUserUI({ loggedIn: false });
        showToast('Berhasil keluar.', 'success');
    });
}

/* ═══════════════════════════════════════════
   UI — USER BAR & SIDEBAR
   ═══════════════════════════════════════════ */
function updateUserUI(user) {
    var uBar = document.getElementById('userBar');
    var navAct = document.getElementById('navActions');
    var gate = document.getElementById('loginGate');
    var fp = document.querySelector('.form-panel');
    var cBar = document.getElementById('creditBar');
    var upBtn = document.getElementById('upgradeBtn');
    var badge = document.getElementById('userPlanBadge');
    var nameEl = document.getElementById('userNameDisplay');
    var tokenEl = document.getElementById('navTokenInfo');

    updateSidebarUser(user);

    if (!user || !user.loggedIn) {
        uBar.classList.remove('show');
        navAct.style.display = '';
        gate.classList.add('show');
        if (cBar) cBar.style.display = 'none';
        if (tokenEl) tokenEl.style.display = 'none';
        var dot = document.getElementById('hamLoggedDot');
        if (dot) dot.style.display = 'none';
        if (fp) fp.style.display = 'none';
        return;
    }

    uBar.classList.add('show');
    navAct.style.display = 'none';
    gate.classList.remove('show');
    if (fp) fp.style.display = '';
    if (cBar) cBar.style.display = 'none';

    var dot2 = document.getElementById('hamLoggedDot');
    if (dot2) dot2.style.display = 'block';

    nameEl.textContent = user.name || user.email;
    badge.textContent = user.plan === 'pro' ? 'PRO' : 'FREE';

    var av = document.getElementById('userAvatar');
    if (user.picture) { av.src = user.picture; av.style.display = 'block'; }
    else { av.style.display = 'none'; }

    if (tokenEl) {
        tokenEl.style.display = '';
        var freeLeft = user.freeLeft != null ? user.freeLeft : (user.freeLimit || 0);
        var tok = user.plan === 'pro'
            ? (user.balance || 0) + ' token'
            : freeLeft + ' token';
        tokenEl.textContent = tok;

        var isLow = user.plan === 'pro'
            ? (user.balance || 0) <= 5
            : freeLeft <= 0;
        tokenEl.className = tokenEl.className.replace(/ text-red-500/g, '') + (isLow ? ' text-red-500' : '');
        if (upBtn) upBtn.style.display = isLow ? '' : 'none';
    }
}

function updateSidebarUser(user) {
    var uSec = document.getElementById('sidebarUserSection');
    var gSec = document.getElementById('sidebarGuestSection');
    var gCta = document.getElementById('sidebarGuestCta');
    var uCta = document.getElementById('sidebarUserCta');

    if (!user || !user.loggedIn) {
        if (uSec) uSec.style.display = 'none';
        if (gSec) gSec.style.display = '';
        if (gCta) gCta.style.display = '';
        if (uCta) uCta.style.display = 'none';
        return;
    }

    if (uSec) uSec.style.display = '';
    if (gSec) gSec.style.display = 'none';
    if (gCta) gCta.style.display = 'none';
    if (uCta) uCta.style.display = '';

    var sName = document.getElementById('sidebarUserName');
    var sEmail = document.getElementById('sidebarUserEmail');
    var sAv = document.getElementById('sidebarAvatar');
    var sAvPh = document.getElementById('sidebarAvatarPlaceholder');
    var sToken = document.getElementById('sidebarTokenChip');
    var sPlan = document.getElementById('sidebarPlanChip');

    if (sName) sName.textContent = user.name || user.email || 'Pengguna';
    if (sEmail) sEmail.textContent = user.email || '';

    if (sAv && user.picture) {
        sAv.src = user.picture;
        sAv.style.display = 'block';
        if (sAvPh) sAvPh.style.display = 'none';
    }

    if (sPlan) {
        sPlan.textContent = user.plan === 'pro' ? 'PRO' : 'FREE';
        sPlan.style.background = user.plan === 'pro' ? '#0070ba' : '#ffc439';
        sPlan.style.color = user.plan === 'pro' ? '#fff' : '#1a2332';
    }

    if (sToken) {
        var freeLeft = user.freeLeft != null ? user.freeLeft : (user.freeLimit || 0);
        var tv = user.plan === 'pro' ? (user.balance || 0) + ' token' : freeLeft + ' token';
        var low = user.plan === 'pro' ? (user.balance || 0) <= 5 : freeLeft <= 0;
        sToken.textContent = tv;
        sToken.style.background = low ? 'rgba(229,62,62,0.25)' : 'rgba(255,255,255,0.18)';
        sToken.style.borderColor = low ? 'rgba(229,62,62,0.5)' : 'rgba(255,255,255,0.35)';
    }
}

/* ═══════════════════════════════════════════
   MODAL / DRAWER
   ═══════════════════════════════════════════ */
function openLoginModal(e) {
    if (e) e.preventDefault();
    document.getElementById('loginModal').classList.add('show');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}

function toggleDrawer() {
    var d = document.getElementById('mobileDrawer');
    var ov = document.getElementById('sidebarOverlay');
    var h = document.getElementById('navHamburger');
    var isOpen = d.classList.contains('open');
    d.classList.toggle('open');
    if (ov) ov.classList.toggle('open');
    h.classList.toggle('open');
    document.body.style.overflow = !isOpen ? 'hidden' : '';
}

/* ═══════════════════════════════════════════
   BUG FIX — "Mulai Gratis" di pricing
   Jika sudah login → scroll ke #generator
   Jika belum login → buka modal login
   ═══════════════════════════════════════════ */
function handleFreeStart(e) {
    if (currentUser && currentUser.loggedIn) {
        /* sudah login: biarkan href="#generator" bekerja normal */
        return true;
    }
    /* belum login: cegah scroll, buka modal */
    e.preventDefault();
    openLoginModal();
}

/* ═══════════════════════════════════════════
   PRICING LINKS
   ═══════════════════════════════════════════ */
function setupPricingLinks() {
    fetch('/api/config')
        .then(function (r) { return r.json(); })
        .then(function (d) {
            if (d.proLink) {
                document.getElementById('proMonthlyBtn').href = d.proLink;
                document.getElementById('proYearlyBtn').href = d.proLink;
            }
        })
        .catch(function () { });
}

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
function switchTab(btn, id) {
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
}

/* ═══════════════════════════════════════════
   SKILLS
   ═══════════════════════════════════════════ */
function handleSkillInput(e) {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        var v = document.getElementById('skillInput').value.trim().replace(/,$/, '');
        if (v && skills.indexOf(v) === -1) { skills.push(v); renderSkills(); }
        document.getElementById('skillInput').value = '';
    }
}

function removeSkill(i) {
    skills.splice(i, 1);
    renderSkills();
}

function renderSkills() {
    document.getElementById('skillsTags').innerHTML = skills.map(function (s, i) {
        return '<div class="skill-tag inline-flex items-center gap-1.5 bg-[#0070ba]/8 border border-[#0070ba]/20 text-[#0070ba] text-[11px] font-medium px-2.5 py-1 rounded">' +
            escHtml(s) +
            '<button onclick="removeSkill(' + i + ')" class="bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 text-red-400 hover:text-white cursor-pointer text-xs leading-none rounded-full w-4 h-4 flex items-center justify-center transition-all duration-150">\u00d7</button>' +
            '</div>';
    }).join('');
}

/* ═══════════════════════════════════════════
   EXPERIENCE
   ═══════════════════════════════════════════ */
function addExperience() {
    var id = Date.now();
    experiences.push({ id: id });
    var div = document.createElement('div');
    div.id = 'exp-' + id;
    div.className = 'bg-white border border-[#d0daea] p-5 mb-4';
    div.innerHTML =
        '<div class="flex justify-between items-center mb-3.5">' +
        '<span class="text-[10px] tracking-widest uppercase text-[#0070ba] font-semibold">Pengalaman</span>' +
        '<button onclick="removeExp(' + id + ')" class="bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 text-red-400 hover:text-white w-7 h-7 rounded-full flex items-center justify-center cursor-pointer text-sm font-bold transition-all duration-150">\u00d7</button>' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3">' +
        _inputBlock('Jabatan *', 'exp_title_' + id, 'Senior Developer') +
        _inputBlock('Perusahaan *', 'exp_company_' + id, 'PT Teknologi Maju') +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3">' +
        _inputBlock('Mulai', 'exp_start_' + id, 'Jan 2022') +
        _inputBlock('Selesai', 'exp_end_' + id, 'Sekarang') +
        '</div>' +
        '<div>' +
        '<label class="block text-[10px] tracking-widest uppercase text-[#718096] mb-2 font-medium">Deskripsi Tugas</label>' +
        '<textarea id="exp_desc_' + id + '" placeholder="Jelaskan tanggung jawab..." ' +
        'class="w-full bg-white border border-[#d0daea] text-gray-700 px-4 py-3 text-sm outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10 transition-all resize-y min-h-[80px] leading-relaxed"></textarea>' +
        '</div>';
    document.getElementById('exp-list').appendChild(div);
}

function removeExp(id) {
    experiences = experiences.filter(function (e) { return e.id !== id; });
    var el = document.getElementById('exp-' + id);
    if (el) el.remove();
}

/* ═══════════════════════════════════════════
   EDUCATION
   ═══════════════════════════════════════════ */
function addEducation() {
    var id = Date.now();
    educations.push({ id: id });
    var div = document.createElement('div');
    div.id = 'edu-' + id;
    div.className = 'bg-white border border-[#d0daea] p-5 mb-4';
    div.innerHTML =
        '<div class="flex justify-between items-center mb-3.5">' +
        '<span class="text-[10px] tracking-widest uppercase text-[#0070ba] font-semibold">Pendidikan</span>' +
        '<button onclick="removeEdu(' + id + ')" class="bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 text-red-400 hover:text-white w-7 h-7 rounded-full flex items-center justify-center cursor-pointer text-sm font-bold transition-all duration-150">\u00d7</button>' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3">' +
        _inputBlock('Gelar / Jurusan *', 'edu_degree_' + id, 'S1 Teknik Informatika') +
        _inputBlock('Institusi *', 'edu_school_' + id, 'Universitas Indonesia') +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3">' +
        _inputBlock('Tahun Masuk', 'edu_start_' + id, '2018') +
        _inputBlock('Tahun Lulus', 'edu_end_' + id, '2022') +
        '</div>' +
        '<div>' +
        _inputBlock('IPK / Catatan', 'edu_gpa_' + id, 'IPK 3.85 / Cum Laude') +
        '</div>';
    document.getElementById('edu-list').appendChild(div);
}

function removeEdu(id) {
    educations = educations.filter(function (e) { return e.id !== id; });
    var el = document.getElementById('edu-' + id);
    if (el) el.remove();
}

/* ── helper: single labelled input ── */
function _inputBlock(label, id, placeholder) {
    return '<div>' +
        '<label class="block text-[10px] tracking-widest uppercase text-[#718096] mb-2 font-medium">' + label + '</label>' +
        '<input type="text" id="' + id + '" placeholder="' + placeholder + '" ' +
        'class="w-full bg-white border border-[#d0daea] text-gray-700 px-4 py-3 text-sm outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10 transition-all">' +
        '</div>';
}

/* ═══════════════════════════════════════════
   COLLECT FORM DATA
   ═══════════════════════════════════════════ */
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
}

function collectData() {
    var expData = [];
    var eduData = [];

    experiences.forEach(function (e) {
        var t = getVal('exp_title_' + e.id);
        var c = getVal('exp_company_' + e.id);
        if (t && c) {
            expData.push({
                title: t,
                company: c,
                start: getVal('exp_start_' + e.id),
                end: getVal('exp_end_' + e.id),
                desc: getVal('exp_desc_' + e.id)
            });
        }
    });

    educations.forEach(function (e) {
        var d = getVal('edu_degree_' + e.id);
        var s = getVal('edu_school_' + e.id);
        if (d && s) {
            eduData.push({
                degree: d,
                school: s,
                start: getVal('edu_start_' + e.id),
                end: getVal('edu_end_' + e.id),
                gpa: getVal('edu_gpa_' + e.id)
            });
        }
    });

    return {
        name: getVal('f_name'),
        profession: getVal('f_profession'),
        email: getVal('f_email'),
        phone: getVal('f_phone'),
        location: getVal('f_location'),
        linkedin: getVal('f_linkedin'),
        summary: getVal('f_summary'),
        lang: getVal('f_lang'),
        style: getVal('f_style'),
        skills: skills,
        certs: getVal('f_certs'),
        awards: getVal('f_awards'),
        experiences: expData,
        educations: eduData
    };
}

/* ═══════════════════════════════════════════
   BUILD AI PROMPT
   ═══════════════════════════════════════════ */
function buildPrompt(data) {
    var lang = data.lang === 'en' ? 'English' : 'Bahasa Indonesia';
    var expStr = data.experiences.map(function (e) {
        return '- ' + e.title + ' di ' + e.company + ' (' + e.start + '-' + e.end + '): ' + e.desc;
    }).join('\n') || 'Tidak ada';
    var eduStr = data.educations.map(function (e) {
        return '- ' + e.degree + ', ' + e.school + ' (' + e.start + '-' + e.end + ') ' + e.gpa;
    }).join('\n') || 'Tidak ada';

    return [
        'Kamu adalah career coach dan CV writer profesional. Buat CV profesional, ATS-friendly.',
        '',
        'Bahasa: ' + lang,
        'Gaya: ' + data.style,
        'Output: JSON saja',
        '',
        'Nama: ' + (data.name || ''),
        'Profesi: ' + (data.profession || ''),
        'Email: ' + (data.email || ''),
        'Telepon: ' + (data.phone || ''),
        'Lokasi: ' + (data.location || ''),
        'LinkedIn: ' + (data.linkedin || ''),
        'Ringkasan: ' + (data.summary || 'auto'),
        '',
        'Pengalaman:',
        expStr,
        '',
        'Pendidikan:',
        eduStr,
        'Keahlian: ' + (data.skills.join(', ') || '-'),
        'Sertifikasi: ' + (data.certs || '-'),
        'Penghargaan: ' + (data.awards || '-'),
        '',
        'JSON output:',
        '{"name":"...","profession":"...","email":"...","phone":"...","location":"...","linkedin":"...","summary":"...","experiences":[{"title":"...","company":"...","period":"...","description":"..."}],"educations":[{"degree":"...","school":"...","period":"...","note":"..."}],"skills":["..."],"certifications":"...","awards":"..."}'
    ].join('\n');
}

/* ═══════════════════════════════════════════
   GENERATE CV
   ═══════════════════════════════════════════ */
function generateCV() {
    if (!currentUser || !currentUser.loggedIn) { openLoginModal(); return; }

    var data = collectData();
    if (!data.name || !data.profession || !data.email) {
        showToast('Lengkapi nama, profesi, dan email terlebih dahulu', 'error');
        return;
    }

    var btn = document.getElementById('generateBtn');
    var sp = document.getElementById('spinner');
    var overlay = document.getElementById('generateOverlay');

    btn.classList.add('loading');
    btn.disabled = true;
    sp.style.display = 'block';
    if (overlay) overlay.classList.add('show');

    fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(data) }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
    })
        .then(function (r) {
            return r.json().then(function (b) {
                if (!r.ok) {
                    var err = new Error(b.error || 'error');
                    err.code = b.error;
                    err.status = r.status;
                    throw err;
                }
                return b;
            });
        })
        .then(function (body) {
            var t = (body.response && body.response.candidates &&
                body.response.candidates[0] &&
                body.response.candidates[0].content &&
                body.response.candidates[0].content.parts &&
                body.response.candidates[0].content.parts[0].text) || '';
            var m = t.match(/\{[\s\S]*\}/);
            if (!m) throw new Error('parse_failed');
            renderCVDocument(JSON.parse(m[0]));
            showToast('CV kamu berhasil dibuat! ✨', 'success');
            loadUser();
        })
        .catch(function (err) {
            var msg = '';
            var upBtn = document.getElementById('upgradeBtn');
            if (err.code === 'login_required') { openLoginModal(); return; }
            else if (err.code === 'free_limit') {
                msg = 'Batas generate harian tercapai. Upgrade ke Pro via Mayar.id!';
                if (upBtn) upBtn.style.display = '';
            } else if (err.code === 'no_credit') {
                msg = 'Kredit Pro kamu habis.';
            } else if (err.code === 'api_limit') {
                msg = 'Batas harian tercapai. Coba lagi besok.';
            } else if (!err.status) {
                msg = 'Tidak dapat terhubung ke server.';
            } else if (err.message === 'parse_failed') {
                msg = 'Gagal memproses respons. Coba generate ulang.';
            } else {
                msg = 'Terjadi kesalahan. Silakan coba lagi.';
            }
            showToast(msg, 'error');
        })
        .finally(function () {
            btn.classList.remove('loading');
            btn.disabled = false;
            sp.style.display = 'none';
            var ov = document.getElementById('generateOverlay');
            if (ov) ov.classList.remove('show');
        });
}

/* ═══════════════════════════════════════════
   RENDER CV DOCUMENT
   ═══════════════════════════════════════════ */
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderCVDocument(cv) {
    var expHtml = '';
    var eduHtml = '';
    var skillsHtml = '';
    var contacts = '';

    (cv.experiences || []).forEach(function (e) {
        expHtml +=
            '<div class="cv-experience-item">' +
            '<div class="cv-job-title">' + escHtml(e.title || '') + '</div>' +
            '<div class="cv-company">' + escHtml(e.company || '') + '</div>' +
            '<div class="cv-date">' + escHtml(e.period || '') + '</div>' +
            '<div class="cv-desc">' + escHtml(e.description || '').replace(/\n/g, '<br>') + '</div>' +
            '</div>';
    });

    (cv.educations || []).forEach(function (e) {
        eduHtml +=
            '<div class="cv-education-item">' +
            '<div>' +
            '<div class="cv-degree">' + escHtml(e.degree || '') + '</div>' +
            '<div class="cv-school">' + escHtml(e.school || '') + (e.note ? ' · ' + escHtml(e.note) : '') + '</div>' +
            '</div>' +
            '<div class="cv-edu-date">' + escHtml(e.period || '') + '</div>' +
            '</div>';
    });

    (cv.skills || []).forEach(function (s) {
        skillsHtml += '<div class="cv-skill-chip">' + escHtml(s) + '</div>';
    });

    if (cv.email) contacts += '<div class="cv-contact-item">\u2709 ' + escHtml(cv.email) + '</div>';
    if (cv.phone) contacts += '<div class="cv-contact-item">\uD83D\uDCDE ' + escHtml(cv.phone) + '</div>';
    if (cv.location) contacts += '<div class="cv-contact-item">\uD83D\uDCCD ' + escHtml(cv.location) + '</div>';
    if (cv.linkedin) contacts += '<div class="cv-contact-item">\uD83D\uDD17 ' + escHtml(cv.linkedin) + '</div>';

    var html =
        '<div class="cv-document" id="cv-doc-print">' +
        '<div class="cv-header-section">' +
        '<div class="cv-name">' + escHtml(cv.name || '') + '</div>' +
        '<div class="cv-profession">' + escHtml(cv.profession || '') + '</div>' +
        '<div class="cv-contact-row">' + contacts + '</div>' +
        '</div>';

    if (cv.summary) html += '<div class="cv-section"><div class="cv-section-title">Profil</div><div class="cv-summary-text">' + escHtml(cv.summary) + '</div></div>';
    if (expHtml) html += '<div class="cv-section"><div class="cv-section-title">Pengalaman Kerja</div>' + expHtml + '</div>';
    if (eduHtml) html += '<div class="cv-section"><div class="cv-section-title">Pendidikan</div>' + eduHtml + '</div>';
    if (skillsHtml) html += '<div class="cv-section"><div class="cv-section-title">Keahlian</div><div class="cv-skills-grid">' + skillsHtml + '</div></div>';
    if (cv.certifications) html += '<div class="cv-section"><div class="cv-section-title">Sertifikasi</div><div class="cv-summary-text">' + escHtml(cv.certifications) + '</div></div>';
    if (cv.awards) html += '<div class="cv-section"><div class="cv-section-title">Penghargaan</div><div class="cv-summary-text">' + escHtml(cv.awards) + '</div></div>';

    html += '</div>';

    var r = document.getElementById('cv-rendered');
    r.innerHTML = html;
    document.getElementById('cvEmpty').style.display = 'none';
    r.style.display = 'block';
    document.getElementById('copyBtn').style.display = 'flex';
    document.getElementById('printBtn').style.display = 'flex';
}

/* ═══════════════════════════════════════════
   COPY & PRINT
   ═══════════════════════════════════════════ */
function copyCV() {
    var t = document.getElementById('cv-rendered').innerText;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(t)
            .then(function () { showToast('CV berhasil disalin!', 'success'); })
            .catch(function () { showToast('Gagal menyalin.', 'error'); });
    }
}

function printCV() {
    var el = document.getElementById('cv-doc-print');
    if (!el) { showToast('Generate CV terlebih dahulu', 'error'); return; }

    var btn = document.getElementById('printBtn');
    if (btn) {
        btn.textContent = 'Membuka PDF...';
        btn.disabled = true;
        setTimeout(function () { btn.textContent = 'Cetak PDF'; btn.disabled = false; }, 3000);
    }

    var css = [
        '@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap");',
        '*{margin:0;padding:0;box-sizing:border-box}',
        'html,body{background:#fff;font-family:Poppins,sans-serif;color:#1a1a18}',
        '#cv-doc-print{padding:40px;max-width:794px;margin:0 auto;background:#fafaf7}',
        '.cv-header-section{border-bottom:3px solid #1a1a18;padding-bottom:24px;margin-bottom:28px}',
        '.cv-name{font-size:34px;font-weight:900;line-height:1.1;color:#0a0a08;letter-spacing:-1px}',
        '.cv-profession{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#0070ba;margin:8px 0;font-weight:600}',
        '.cv-contact-row{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px}',
        '.cv-contact-item{font-size:12px;color:#555;display:flex;align-items:center;gap:5px}',
        '.cv-section{margin-bottom:24px}',
        '.cv-section-title{font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#0070ba;font-weight:700;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #d0daea}',
        '.cv-summary-text{font-size:13px;line-height:1.75;color:#333}',
        '.cv-experience-item{margin-bottom:16px;padding-left:12px;border-left:2px solid #0085d4}',
        '.cv-job-title{font-weight:700;font-size:14px;color:#0a0a08}',
        '.cv-company{font-size:11px;color:#0070ba;letter-spacing:1px;margin:2px 0}',
        '.cv-date{font-size:10px;color:#888;margin-bottom:5px}',
        '.cv-desc{font-size:12px;line-height:1.7;color:#444}',
        '.cv-skills-grid{display:flex;flex-wrap:wrap;gap:6px}',
        '.cv-skill-chip{background:#e8f0fb;border:1px solid #c0d4f0;font-size:10px;color:#0070ba;padding:3px 10px;border-radius:3px}',
        '.cv-education-item{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}',
        '.cv-degree{font-weight:700;font-size:13px;color:#0a0a08}',
        '.cv-school{font-size:12px;color:#555;margin-top:2px}',
        '.cv-edu-date{font-size:11px;color:#888;white-space:nowrap;margin-left:12px}',
        '@media print{@page{margin:15mm}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}#cv-doc-print{padding:0;max-width:100%}}'
    ].join('\n');

    var win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { showToast('Pop-up diblokir. Izinkan pop-up lalu coba lagi.', 'error'); return; }
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CV</title><style>' + css + '</style></head><body>' + el.outerHTML + '</body></html>');
    win.document.close();
    win.focus();
    win.onload = function () { setTimeout(function () { win.print(); }, 800); };
    setTimeout(function () { if (!win.closed) win.print(); }, 1200);
    showToast('Pilih "Save as PDF" di dialog print', 'success');
}

/* ═══════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════ */
function showToast(msg, type) {
    type = type || 'success';
    var t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toastIcon').textContent = type === 'success' ? '✓' : '✗';
    t.className = [
        'toast fixed bottom-8 right-8 bg-white border text-gray-700',
        'px-6 py-3.5 z-[999] flex items-center gap-2.5 text-[12px]',
        'tracking-wide shadow-xl rounded-sm show',
        type === 'success' ? 'border-l-4 border-l-[#0070ba]' : 'border-l-4 border-l-red-500'
    ].join(' ');
    setTimeout(function () { t.classList.remove('show'); }, 3500);
}