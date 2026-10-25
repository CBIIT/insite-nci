
def get_image_details(image_id, conn=None):
    image = conn.getObject("Image", image_id)
    if image:
        info = {}
        if image.getName():
            info["name"] = image.getName()
        if image.getSizeX() and image.getSizeY():
            info["dimension"] = f"{image.getSizeX()} x {image.getSizeY()}"
        if image.getPixelsType():
            info["pixel type"] = image.getPixelsType()

        return info
    return None