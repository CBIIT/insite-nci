
def get_user_info(request, conn):
    session_data = {key: value for key, value in request.session.items() if key == 'connector'}
    connector = session_data["connector"]
    username = 'not connected'
    if conn and conn.isConnected():
        user = conn.getUser()
        username = user.getOmeName()
    return {
        "username": username
    }
    