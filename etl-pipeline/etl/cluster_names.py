CLUSTER_NAME_FIXES = {"SAO_JOSE_ROÇADO": "SAO_JOSE_ROCADO"}


def fix_cluster_names(series):
    return series.replace(CLUSTER_NAME_FIXES)
