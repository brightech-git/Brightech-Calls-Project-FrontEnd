export function ResolveImage(image:string|null|undefined){
    if (!image || image === undefined) return "";

    const baseUrl = "https://calls.brightechsoftware.com" ;

    return `${baseUrl}${image}`

}