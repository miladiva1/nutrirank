"""Prepare signing only in a temporary GitHub-hosted macOS runner."""
import base64
import datetime
import json
import os
from pathlib import Path
import plistlib
import re
import secrets
import shutil
import subprocess
import sys

REQUIRED = ('APPLE_TEAM_ID','APPLE_API_KEY_ID','APPLE_API_ISSUER_ID',
            'APPLE_API_PRIVATE_KEY','APPLE_CERTIFICATE_BASE64',
            'APPLE_CERTIFICATE_PASSWORD','APPLE_PROFILE_BASE64')

def check():
    missing = [name for name in REQUIRED if not os.environ.get(name)]
    if missing:
        raise ValueError('Configure no ambiente apple-testflight: ' + ', '.join(missing))

def run(*args, **kwargs):
    return subprocess.run(args, check=True, capture_output=True, **kwargs)

def paths():
    if os.environ.get('GITHUB_ACTIONS') != 'true' or sys.platform != 'darwin':
        raise ValueError('Assinatura permitida somente no runner macOS do GitHub Actions.')
    root = Path(os.environ['RUNNER_TEMP']).resolve()
    target = root / 'nutrirank-signing'
    if target.parent != root:
        raise ValueError('Pasta temporária inválida.')
    return target

def prepare():
    check()
    target = paths()
    target.mkdir(mode=0o700, exist_ok=True)
    certificate = target / 'certificate.p12'
    profile = target / 'profile.mobileprovision'
    certificate.write_bytes(base64.b64decode(os.environ['APPLE_CERTIFICATE_BASE64'], validate=True))
    profile.write_bytes(base64.b64decode(os.environ['APPLE_PROFILE_BASE64'], validate=True))
    parsed = plistlib.loads(run('security','cms','-D','-i',str(profile)).stdout)
    uuid = parsed['UUID']
    if not re.fullmatch(r'[A-Fa-f0-9-]{36}', uuid):
        raise ValueError('UUID do perfil inválido.')
    team = os.environ['APPLE_TEAM_ID']
    if team not in parsed.get('TeamIdentifier', []):
        raise ValueError('O perfil não pertence ao Team ID configurado.')
    bundle = json.loads(Path('capacitor.config.json').read_text())['appId']
    if parsed.get('Entitlements',{}).get('application-identifier') != team + '.' + bundle:
        raise ValueError('O perfil não corresponde ao identificador do aplicativo.')
    if parsed['ExpirationDate'] <= datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None):
        raise ValueError('O perfil de distribuição expirou.')
    if parsed.get('ProvisionedDevices') or parsed.get('ProvisionsAllDevices'):
        raise ValueError('Use perfil de distribuição App Store Connect, não Ad Hoc ou Enterprise.')
    profiles = Path.home() / 'Library/MobileDevice/Provisioning Profiles'
    profiles.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(profile, profiles / (uuid + '.mobileprovision'))
    (target / 'profile-uuid').write_text(uuid)
    keychain = target / 'signing.keychain-db'
    password = secrets.token_hex(24)
    run('security','create-keychain','-p',password,str(keychain))
    run('security','set-keychain-settings','-lut','21600',str(keychain))
    run('security','unlock-keychain','-p',password,str(keychain))
    run('security','import',str(certificate),'-P',os.environ['APPLE_CERTIFICATE_PASSWORD'],
        '-k',str(keychain),'-T','/usr/bin/codesign','-T','/usr/bin/security')
    run('security','set-key-partition-list','-S','apple-tool:,apple:,codesign:','-s','-k',password,str(keychain))
    run('security','list-keychains','-d','user','-s',str(keychain))
    private = target / ('AuthKey_' + os.environ['APPLE_API_KEY_ID'] + '.p8')
    private.write_text(os.environ['APPLE_API_PRIVATE_KEY'])
    private.chmod(0o600)
    options = {'method':'app-store-connect','teamID':team,'signingStyle':'manual',
               'provisioningProfiles':{bundle:uuid},'manageAppVersionAndBuildNumber':False}
    (target / 'ExportOptions.plist').write_bytes(plistlib.dumps(options))
    print('Perfil validado e assinatura temporária preparada.')

def clean():
    target = paths()
    if not target.exists():
        return
    uuid_file = target / 'profile-uuid'
    if uuid_file.exists() and re.fullmatch(r'[A-Fa-f0-9-]{36}',uuid_file.read_text()):
        (Path.home()/'Library/MobileDevice/Provisioning Profiles'/(uuid_file.read_text()+'.mobileprovision')).unlink(missing_ok=True)
    keychain = target / 'signing.keychain-db'
    if keychain.exists():
        subprocess.run(['security','delete-keychain',str(keychain)],capture_output=True)
    shutil.rmtree(target)

if __name__ == '__main__':
    try:
        {'check':check,'prepare':prepare,'clean':clean}[sys.argv[1]]()
    except subprocess.CalledProcessError:
        sys.exit('A ferramenta Apple recusou a configuração. Confira certificado, senha e perfil; valores privados não são exibidos.')
    except (ValueError, KeyError) as error:
        sys.exit(str(error))
