from wsgiref.simple_server import WSGIServer
from app import create_app, db
from app.models import User
app = create_app()
if __name__ == '__main__':
    # http_server = WSGIServer(('', 5000), app)
    # http_server.serve_forever()
    app.run()
@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User}