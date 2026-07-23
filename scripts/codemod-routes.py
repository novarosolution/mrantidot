#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path('/Volumes/KIOXIA/mrantidot/mobile')
FILES = list((ROOT / 'app').rglob('*.tsx')) + list((ROOT / 'components').rglob('*.tsx'))

STRING_MAP = [
    ("'/(auth)/splash'", 'authRoutes.splash'),
    ('"/(auth)/splash"', 'authRoutes.splash'),
    ("'/(auth)/onboarding'", 'authRoutes.onboarding'),
    ('"/(auth)/onboarding"', 'authRoutes.onboarding'),
    ("'/(auth)/login'", 'authRoutes.login'),
    ('"/(auth)/login"', 'authRoutes.login'),
    ("'/(auth)/register'", 'authRoutes.register'),
    ('"/(auth)/register"', 'authRoutes.register'),
    ("'/(auth)/otp'", 'authRoutes.otp'),
    ('"/(auth)/otp"', 'authRoutes.otp'),
    ("'/(customer)/services'", 'customerRoutes.services'),
    ('"/(customer)/services"', 'customerRoutes.services'),
    ("'/(customer)/bookings'", 'customerRoutes.bookings'),
    ('"/(customer)/bookings"', 'customerRoutes.bookings'),
    ("'/(customer)/offers'", 'customerRoutes.offers'),
    ('"/(customer)/offers"', 'customerRoutes.offers'),
    ("'/(customer)/profile'", 'customerRoutes.profile'),
    ('"/(customer)/profile"', 'customerRoutes.profile'),
    ("'/(customer)/notifications'", 'customerRoutes.notifications'),
    ('"/(customer)/notifications"', 'customerRoutes.notifications'),
    ("'/(customer)/addresses'", 'customerRoutes.addresses'),
    ('"/(customer)/addresses"', 'customerRoutes.addresses'),
    ("'/(customer)/payment-methods'", 'customerRoutes.paymentMethods'),
    ('"/(customer)/payment-methods"', 'customerRoutes.paymentMethods'),
    ("'/(customer)/settings'", 'customerRoutes.settings'),
    ('"/(customer)/settings"', 'customerRoutes.settings'),
    ("'/(customer)/help'", 'customerRoutes.help'),
    ('"/(customer)/help"', 'customerRoutes.help'),
    ("'/(customer)/faq'", 'customerRoutes.faq'),
    ('"/(customer)/faq"', 'customerRoutes.faq'),
    ("'/(customer)/about'", 'customerRoutes.about'),
    ('"/(customer)/about"', 'customerRoutes.about'),
    ("'/(customer)/terms'", 'customerRoutes.terms'),
    ('"/(customer)/terms"', 'customerRoutes.terms'),
    ("'/(customer)/privacy'", 'customerRoutes.privacy'),
    ('"/(customer)/privacy"', 'customerRoutes.privacy'),
    ("'/(customer)/'", 'customerRoutes.home'),
    ('"/(customer)/"', 'customerRoutes.home'),
    ("'/(customer)'", 'customerRoutes.home'),
    ('"/(customer)"', 'customerRoutes.home'),
    ("'/(tech)/profile'", 'techRoutes.profile'),
    ('"/(tech)/profile"', 'techRoutes.profile'),
    ("'/(tech)/analytics'", 'techRoutes.analytics'),
    ('"/(tech)/analytics"', 'techRoutes.analytics'),
    ("'/(tech)/'", 'techRoutes.home'),
    ('"/(tech)/"', 'techRoutes.home'),
    ("'/(tech)'", 'techRoutes.home'),
    ('"/(tech)"', 'techRoutes.home'),
    ("'/(admin)/bookings'", 'adminRoutes.bookings'),
    ('"/(admin)/bookings"', 'adminRoutes.bookings'),
    ("'/(admin)/reports'", 'adminRoutes.reports'),
    ('"/(admin)/reports"', 'adminRoutes.reports'),
    ("'/(admin)/services'", 'adminRoutes.services'),
    ('"/(admin)/services"', 'adminRoutes.services'),
    ("'/(admin)/service-edit'", 'adminRoutes.serviceEdit'),
    ('"/(admin)/service-edit"', 'adminRoutes.serviceEdit'),
    ("'/(admin)/offers'", 'adminRoutes.offers'),
    ('"/(admin)/offers"', 'adminRoutes.offers'),
    ("'/(admin)/offer-edit'", 'adminRoutes.offerEdit'),
    ('"/(admin)/offer-edit"', 'adminRoutes.offerEdit'),
    ("'/(admin)/customers'", 'adminRoutes.customers'),
    ('"/(admin)/customers"', 'adminRoutes.customers'),
    ("'/(admin)/technicians'", 'adminRoutes.technicians'),
    ('"/(admin)/technicians"', 'adminRoutes.technicians'),
    ("'/(admin)/users'", 'adminRoutes.users'),
    ('"/(admin)/users"', 'adminRoutes.users'),
    ("'/(admin)/user-edit'", 'adminRoutes.userEdit'),
    ('"/(admin)/user-edit"', 'adminRoutes.userEdit'),
    ("'/(admin)/notifications'", 'adminRoutes.notifications'),
    ('"/(admin)/notifications"', 'adminRoutes.notifications'),
    ("'/(admin)/settings'", 'adminRoutes.settings'),
    ('"/(admin)/settings"', 'adminRoutes.settings'),
    ("'/(admin)/content'", 'adminRoutes.content'),
    ('"/(admin)/content"', 'adminRoutes.content'),
    ("'/(admin)/reviews'", 'adminRoutes.reviews'),
    ('"/(admin)/reviews"', 'adminRoutes.reviews'),
    ("'/(admin)/team'", 'adminRoutes.team'),
    ('"/(admin)/team"', 'adminRoutes.team'),
    ("'/(admin)/'", 'adminRoutes.home'),
    ('"/(admin)/"', 'adminRoutes.home'),
    ("'/(admin)'", 'adminRoutes.home'),
    ('"/(admin)"', 'adminRoutes.home'),
    ("'/book/success'", 'sharedRoutes.bookSuccess'),
    ('"/book/success"', 'sharedRoutes.bookSuccess'),
]

TEMPLATE_PATTERNS = [
    (re.compile(r'`/\(customer\)/booking/\$\{([^}]+)\}`'), r'customerRoutes.booking(\1)'),
    (re.compile(r'`/\(admin\)/booking/\$\{([^}]+)\}`'), r'adminRoutes.booking(\1)'),
    (re.compile(r'`/\(admin\)/customer/\$\{([^}]+)\}`'), r'adminRoutes.customer(\1)'),
    (re.compile(r'`/\(admin\)/technician/\$\{([^}]+)\}`'), r'adminRoutes.technician(\1)'),
    (re.compile(r'`/\(tech\)/job/\$\{([^}]+)\}`'), r'techRoutes.job(\1)'),
    (re.compile(r'`/service/\$\{([^}]+)\}`'), r'sharedRoutes.service(\1)'),
    (re.compile(r'`/browse/\$\{([^}]+)\}`'), r'sharedRoutes.browse(\1)'),
    (re.compile(r'`/book/\$\{([^}]+)\}`'), r'sharedRoutes.bookPath(\1)'),
    (re.compile(r'`/review/\$\{([^}]+)\}`'), r'sharedRoutes.review(\1)'),
    (re.compile(r'`/\(admin\)/bookings\?status=\$\{([^}]+)\}`'), r'adminRoutes.bookingsFiltered({ status: \1 })'),
    (re.compile(r'`/\(admin\)/bookings\?serviceId=\$\{([^}]+)\}`'), r'adminRoutes.bookingsFiltered({ serviceId: \1 })'),
]

NEEDED = {
    'authRoutes': re.compile(r'authRoutes\.'),
    'customerRoutes': re.compile(r'customerRoutes\.'),
    'techRoutes': re.compile(r'techRoutes\.'),
    'adminRoutes': re.compile(r'adminRoutes\.'),
    'sharedRoutes': re.compile(r'sharedRoutes\.'),
    'appPush': re.compile(r'\bappPush\b'),
    'appReplace': re.compile(r'\bappReplace\b'),
    'appHref': re.compile(r'\bappHref\b'),
    'safeGoBack': re.compile(r'\bsafeGoBack\b'),
    'adminGoBack': re.compile(r'\badminGoBack\b'),
    'bookingDetailPath': re.compile(r'\bbookingDetailPath\b'),
    'homeRouteForRole': re.compile(r'\bhomeRouteForRole\b'),
    'adminUserEdit': re.compile(r'\badminUserEdit\b'),
}

changed_files = []
for path in FILES:
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    orig = text
    for a, b in STRING_MAP:
        text = text.replace(a, b)
    for pat, repl in TEMPLATE_PATTERNS:
        text = pat.sub(repl, text)

    uses_routes = any(
        NEEDED[k].search(text)
        for k in ('authRoutes', 'customerRoutes', 'techRoutes', 'adminRoutes', 'sharedRoutes')
    )
    if uses_routes:
        text = re.sub(r'\brouter\.push\(', 'appPush(', text)
        text = re.sub(r'\brouter\.replace\(', 'appReplace(', text)

    if text == orig:
        continue

    needed = [name for name, pat in NEEDED.items() if pat.search(text)]
    lines = text.splitlines(True)
    found = False
    for i, line in enumerate(lines):
        if "@/lib/routes'" in line or '@/lib/routes"' in line:
            im = re.search(r"import\s*\{([^}]+)\}\s*from\s*['\"]@/lib/routes['\"]", line)
            if im:
                names = [n.strip() for n in im.group(1).split(',') if n.strip()]
                for n in needed:
                    if n not in names:
                        names.append(n)
                lines[i] = 'import { ' + ', '.join(names) + " } from '@/lib/routes';\n"
                found = True
            break
    if not found and needed:
        insert_at = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                insert_at = i + 1
        lines.insert(insert_at, 'import { ' + ', '.join(needed) + " } from '@/lib/routes';\n")
    path.write_text(''.join(lines), encoding='utf-8')
    changed_files.append(str(path.relative_to(ROOT)))

print('updated', len(changed_files))
for f in sorted(changed_files):
    print(f)
